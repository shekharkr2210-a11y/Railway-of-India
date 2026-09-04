import { MaintenanceTask } from './types';

export class DependencyGraph {
  private adjacencyList: Map<string, string[]> = new Map();
  private inDegree: Map<string, number> = new Map();

  constructor(tasks: MaintenanceTask[]) {
    tasks.forEach(task => {
      this.adjacencyList.set(task.id, []);
      this.inDegree.set(task.id, 0);
    });

    tasks.forEach(task => {
      if (task.dependsOn) {
        task.dependsOn.forEach(depId => {
          if (this.adjacencyList.has(depId)) {
            this.adjacencyList.get(depId)!.push(task.id);
            this.inDegree.set(task.id, (this.inDegree.get(task.id) || 0) + 1);
          }
        });
      }
    });
  }

  public hasCycles(): boolean {
    const inDegreeCopy = new Map(this.inDegree);
    const queue: string[] = [];
    let visitedCount = 0;

    inDegreeCopy.forEach((degree, id) => {
      if (degree === 0) queue.push(id);
    });

    while (queue.length > 0) {
      const current = queue.shift()!;
      visitedCount++;

      const neighbors = this.adjacencyList.get(current) || [];
      neighbors.forEach(neighbor => {
        inDegreeCopy.set(neighbor, inDegreeCopy.get(neighbor)! - 1);
        if (inDegreeCopy.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      });
    }

    return visitedCount !== this.adjacencyList.size;
  }

  public getTopologicalSort(): string[] {
    if (this.hasCycles()) {
      throw new Error("Dependency cycle detected");
    }

    const inDegreeCopy = new Map(this.inDegree);
    const queue: string[] = [];
    const result: string[] = [];

    inDegreeCopy.forEach((degree, id) => {
      if (degree === 0) queue.push(id);
    });

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      const neighbors = this.adjacencyList.get(current) || [];
      neighbors.forEach(neighbor => {
        inDegreeCopy.set(neighbor, inDegreeCopy.get(neighbor)! - 1);
        if (inDegreeCopy.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      });
    }

    return result;
  }

  public getParallelExecutionGroups(): string[][] {
    if (this.hasCycles()) {
      throw new Error("Dependency cycle detected");
    }

    const groups: string[][] = [];
    const inDegreeCopy = new Map(this.inDegree);
    let queue: string[] = [];

    inDegreeCopy.forEach((degree, id) => {
      if (degree === 0) queue.push(id);
    });

    while (queue.length > 0) {
      groups.push([...queue]);
      const nextQueue: string[] = [];

      queue.forEach(current => {
        const neighbors = this.adjacencyList.get(current) || [];
        neighbors.forEach(neighbor => {
          inDegreeCopy.set(neighbor, inDegreeCopy.get(neighbor)! - 1);
          if (inDegreeCopy.get(neighbor) === 0) {
            nextQueue.push(neighbor);
          }
        });
      });

      queue = nextQueue;
    }

    return groups;
  }
}
