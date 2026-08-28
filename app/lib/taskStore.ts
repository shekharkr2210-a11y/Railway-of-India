import { MaintenanceTask, Department, TaskSeverity } from './types';
import { INITIAL_MAINTENANCE_TASKS } from './mockData';

// Global task store across server route invocations
class TaskStore {
  private tasks: MaintenanceTask[] = [...INITIAL_MAINTENANCE_TASKS];

  public getAll(): MaintenanceTask[] {
    return [...this.tasks];
  }

  public getByFilter(filter: {
    zone?: string | null;
    division?: string | null;
    department?: string | null;
    severity?: string | null;
    status?: string | null;
  }): MaintenanceTask[] {
    return this.tasks.filter(t => {
      if (filter.zone && filter.zone !== 'ALL' && t.zoneCode !== filter.zone) return false;
      if (filter.division && filter.division !== 'ALL' && t.divisionCode !== filter.division) return false;
      if (filter.department && filter.department !== 'ALL' && t.department !== filter.department) return false;
      if (filter.severity && filter.severity !== 'ALL' && t.severity !== filter.severity) return false;
      if (filter.status && filter.status !== 'ALL' && t.status !== filter.status) return false;
      return true;
    });
  }

  public getById(id: string): MaintenanceTask | undefined {
    return this.tasks.find(t => t.id === id);
  }

  public add(task: MaintenanceTask): MaintenanceTask {
    this.tasks.unshift(task);
    return task;
  }

  public addBatch(tasks: MaintenanceTask[]): MaintenanceTask[] {
    this.tasks = [...tasks, ...this.tasks];
    return tasks;
  }

  public update(id: string, updates: Partial<MaintenanceTask>): MaintenanceTask | null {
    const idx = this.tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;
    this.tasks[idx] = { ...this.tasks[idx], ...updates };
    return this.tasks[idx];
  }

  public delete(id: string): boolean {
    const initialLen = this.tasks.length;
    this.tasks = this.tasks.filter(t => t.id !== id);
    return this.tasks.length < initialLen;
  }

  public reset(): void {
    this.tasks = [...INITIAL_MAINTENANCE_TASKS];
  }
}

// Global singleton across serverless invocations
const globalForTaskStore = globalThis as unknown as { taskStoreInstance?: TaskStore };
export const taskStore = globalForTaskStore.taskStoreInstance ?? new TaskStore();
if (process.env.NODE_ENV !== 'production') globalForTaskStore.taskStoreInstance = taskStore;
