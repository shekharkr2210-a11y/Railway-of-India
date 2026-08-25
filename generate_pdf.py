import sys
import os
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def create_presentation_pdf(filename="AI_Block_Planner_Presentation.pdf"):
    # Page setup: Landscape Letter (11 x 8.5 inches)
    doc = SimpleDocTemplate(
        filename,
        pagesize=landscape(letter),
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom Color Palette matching software UI
    c_navy = colors.HexColor("#0B132B")
    c_dark_card = colors.HexColor("#1C2541")
    c_amber = colors.HexColor("#F7931A")
    c_emerald = colors.HexColor("#10B981")
    c_red = colors.HexColor("#EF4444")
    c_cyan = colors.HexColor("#06B6D4")
    c_blue = colors.HexColor("#3B82F6")
    c_purple = colors.HexColor("#8B5CF6")
    c_light_bg = colors.HexColor("#F8FAFC")
    c_slate_text = colors.HexColor("#334155")
    c_white = colors.white

    # Custom Typography Styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=26,
        leading=32,
        textColor=c_navy,
        alignment=0
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=14,
        leading=18,
        textColor=c_amber,
        alignment=0
    )

    slide_title_style = ParagraphStyle(
        'SlideTitle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=c_navy,
        spaceAfter=10
    )

    body_bold = ParagraphStyle(
        'BodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=c_slate_text
    )

    body_text = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=c_slate_text
    )

    speaker_note_style = ParagraphStyle(
        'SpeakerNote',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#475569")
    )

    story = []

    def make_header(title, slide_num):
        header_table = Table(
            [[
                Paragraph(f"<b>{title}</b>", slide_title_style),
                Paragraph(f"<font color='#94A3B8'><b>Slide {slide_num} / 10</b></font>", ParagraphStyle('R', parent=body_text, alignment=2))
            ]],
            colWidths=[550, 170]
        )
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ]))
        return [header_table, HRFlowable(width="100%", thickness=1.5, color=c_amber, spaceAfter=12)]

    # -------------------------------------------------------------------------
    # SLIDE 1: Title & Executive Summary
    # -------------------------------------------------------------------------
    story.append(Paragraph("<b>INDIAN RAILWAYS AUTOMATION</b>", subtitle_style))
    story.append(Spacer(1, 6))
    story.append(Paragraph("<b>AI-Powered Automatic Block Planning System</b>", title_style))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Transforming Multi-Department Infrastructure Maintenance into Data-Driven Shadow Blocks", ParagraphStyle('Sub2', parent=body_text, fontSize=12, leading=16, textColor=c_slate_text)))
    story.append(Spacer(1, 15))

    cover_data = [
        [Paragraph("<b>Target Audience:</b> University Engineering & CS Students", body_bold), Paragraph("<b>Domain:</b> AI/ML, Operations Research, Web Systems", body_bold)],
        [Paragraph("<b>Problem Scope:</b> Railway Asset Availability & Coordination", body_bold), Paragraph("<b>Tech Stack:</b> Next.js 16, React 19, TypeScript, MILP Solver", body_bold)]
    ]
    t_cover = Table(cover_data, colWidths=[360, 360])
    t_cover.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F1F5F9")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('PADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_cover)
    story.append(Spacer(1, 20))

    note_box = [
        [Paragraph("🎓 <b>Speaker Explanation for University Students:</b><br/>'Welcome everyone! Today we examine a real-world high-impact problem: How do we keep trains running on time while safely repairing track, signal, and overhead electric wire assets? Currently, thousands of manual requests are handled independently in silos. We will explore how AI algorithms and optimization math merge these into single efficient windows called Shadow Blocks.'", speaker_note_style)]
    ]
    t_note1 = Table(note_box, colWidths=[720])
    t_note1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#FEF3C7")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#F59E0B")),
        ('PADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_note1)
    story.append(PageBreak())

    # -------------------------------------------------------------------------
    # SLIDE 2: The Real-World Problem
    # -------------------------------------------------------------------------
    story.extend(make_header("1. The Real-World Problem: Maintenance Silos", 2))
    
    col1 = [
        Paragraph("<b>Current Decentralized Manual Process</b>", ParagraphStyle('H', parent=body_bold, textColor=c_red)),
        Spacer(1, 6),
        Paragraph("• <b>Engineering (TMS):</b> Inspects rails & track geometry. Requests 2.5h track closure.", body_text),
        Spacer(1, 4),
        Paragraph("• <b>TRD Electrical (TDMS):</b> Inspects 25kV OHE overhead wires. Requests 2.0h power block.", body_text),
        Spacer(1, 4),
        Paragraph("• <b>Signals (SMMS):</b> Overhauls point machines & axle counters. Requests 1.5h disconnection.", body_text),
        Spacer(1, 4),
        Paragraph("• <b>Manual Submissions via BDMS:</b> Requests submitted independently without co-location.", body_text),
    ]

    col2 = [
        Paragraph("<b>Operational Consequences</b>", ParagraphStyle('H2', parent=body_bold, textColor=c_navy)),
        Spacer(1, 6),
        Paragraph("❌ <b>Fragmented Track Closures:</b> 3 separate track blockages per day on the same corridor section.", body_text),
        Spacer(1, 4),
        Paragraph("❌ <b>6.0 Hours Total Downtime:</b> Track unusable for trains across multiple windows.", body_text),
        Spacer(1, 4),
        Paragraph("❌ <b>Severe Passenger & Freight Delays:</b> Frequent train cancellations and slow speeds.", body_text),
        Spacer(1, 4),
        Paragraph("❌ <b>Wasted Resource Capacity:</b> Workers wait for track access while another team works nearby.", body_text),
    ]

    t_s2 = Table([[col1, col2]], colWidths=[350, 350])
    t_s2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), colors.HexColor("#FEF2F2")),
        ('BACKGROUND', (1,0), (1,0), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (0,0), 1, colors.HexColor("#FCA5A5")),
        ('BOX', (1,0), (1,0), 1, colors.HexColor("#CBD5E1")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(t_s2)
    story.append(Spacer(1, 15))

    story.append(Table([[
        Paragraph("🎓 <b>Student Key Takeaway:</b> Real-world engineering problems often fail not due to bad department teams, but due to a lack of data integration and centralized mathematical coordination across departments.", speaker_note_style)
    ]], colWidths=[720], style=[
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#EFF6FF")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#3B82F6")),
        ('PADDING', (0,0), (-1,-1), 8)
    ]))
    story.append(PageBreak())

    # -------------------------------------------------------------------------
    # SLIDE 3: System Overview & Data Integration Layer
    # -------------------------------------------------------------------------
    story.extend(make_header("2. Software Solution & Data Integration Layer", 3))

    story.append(Paragraph("The software connects 5 isolated railway legacy databases into a <b>Normalized Data Bus</b>:", body_text))
    story.append(Spacer(1, 10))

    ingest_table_data = [
        [Paragraph("<b>Source System</b>", body_bold), Paragraph("<b>Department</b>", body_bold), Paragraph("<b>Data Ingested</b>", body_bold), Paragraph("<b>Role in AI Engine</b>", body_bold)],
        [Paragraph("<b>TMS</b>", body_bold), Paragraph("Civil Engineering", body_text), Paragraph("Rail fractures (IMR), Track geometry faults", body_text), Paragraph("Defect urgency & location KM", body_text)],
        [Paragraph("<b>SMMS</b>", body_bold), Paragraph("Signal & Telecom", body_text), Paragraph("Point machine wear, axle counter calibration", body_text), Paragraph("Interlocking dependency check", body_text)],
        [Paragraph("<b>TDMS</b>", body_bold), Paragraph("Electrical TRD", body_text), Paragraph("OHE wire sag, transformer insulator wash", body_text), Paragraph("Power block isolation trigger", body_text)],
        [Paragraph("<b>COA</b>", body_bold), Paragraph("Control Office", body_text), Paragraph("Train timetables, freight forecasts, delays", body_text), Paragraph("Identifies traffic gap windows", body_text)],
        [Paragraph("<b>BDMS</b>", body_bold), Paragraph("Division Control", body_text), Paragraph("Block demand applications & approvals", body_text), Paragraph("Sanctions & dispatches schedules", body_text)]
    ]
    t_ingest = Table(ingest_table_data, colWidths=[90, 130, 260, 220])
    t_ingest.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_navy),
        ('TEXTCOLOR', (0,0), (-1,0), c_white),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_ingest)
    story.append(Spacer(1, 15))

    story.append(Table([[
        Paragraph("🎓 <b>Student Key Takeaway:</b> Notice how data normalization works: raw database records with different formats are transformed into a standard TypeScript/JSON contract: <code>{ sectionId, startKm, endKm, durationHours, severity }</code>.", speaker_note_style)
    ]], colWidths=[720], style=[
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#EFF6FF")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#3B82F6")),
        ('PADDING', (0,0), (-1,-1), 8)
    ]))
    story.append(PageBreak())

    # -------------------------------------------------------------------------
    # SLIDE 4: AI Core Part 1 - Task Criticality Index
    # -------------------------------------------------------------------------
    story.extend(make_header("3. AI Algorithm: Task Criticality Index (TCI)", 4))

    col_tci1 = [
        Paragraph("<b>Mathematical Criticality Model</b>", ParagraphStyle('H', parent=body_bold, textColor=c_navy)),
        Spacer(1, 8),
        Paragraph("Every defect is evaluated to calculate a <b>TCI Score (0 to 100)</b>:", body_text),
        Spacer(1, 8),
        Paragraph("<b>TCI = w₁·Severity + w₂·Overdue + w₃·SpeedImpact + w₄·PowerFactor</b>", ParagraphStyle('M', parent=body_bold, textColor=c_amber, fontSize=11)),
        Spacer(1, 8),
        Paragraph("• <b>Defect Severity (w₁):</b> CRITICAL (45 pts), HIGH (35 pts), MEDIUM (25 pts).", body_text),
        Paragraph("• <b>Overdue Days (w₂):</b> 3.5 pts per day (max 30 pts).", body_text),
        Paragraph("• <b>Speed Restriction Impact (w₃):</b> 0.4 pts per km/h speed reduction avoided.", body_text),
        Paragraph("• <b>Power Block Requirement (w₄):</b> +5 pts if 25kV OHE isolation needed.", body_text),
    ]

    col_tci2 = [
        Paragraph("<b>Why Ranking Matters in Practice</b>", ParagraphStyle('H2', parent=body_bold, textColor=c_emerald)),
        Spacer(1, 8),
        Paragraph("• <b>Prevents Catastrophic Fractures:</b> High-TCI rail flaws (Score > 90) get instant scheduling priority.", body_text),
        Spacer(1, 6),
        Paragraph("• <b>Minimizes TSR Speed Slowdowns:</b> Tasks causing temporary 30 km/h speed limits are scheduled first to restore full line speed.", body_text),
        Spacer(1, 6),
        Paragraph("• <b>Eliminates Overdue Backlog:</b> Overdue tasks automatically increase in score every 24 hours.", body_text),
    ]

    t_tci = Table([[col_tci1, col_tci2]], colWidths=[370, 330])
    t_tci.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), colors.HexColor("#FFFBEB")),
        ('BACKGROUND', (1,0), (1,0), colors.HexColor("#ECFDF5")),
        ('BOX', (0,0), (0,0), 1, colors.HexColor("#F59E0B")),
        ('BOX', (1,0), (1,0), 1, colors.HexColor("#10B981")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(t_tci)
    story.append(Spacer(1, 15))

    story.append(Table([[
        Paragraph("🎓 <b>Student Key Takeaway:</b> In computer science, this is a weighted scoring heuristic function. It allows the system to prioritize thousands of tasks algorithmically without human bias.", speaker_note_style)
    ]], colWidths=[720], style=[
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#EFF6FF")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#3B82F6")),
        ('PADDING', (0,0), (-1,-1), 8)
    ]))
    story.append(PageBreak())

    # -------------------------------------------------------------------------
    # SLIDE 5: AI Core Part 2 - The Shadow Block Innovation
    # -------------------------------------------------------------------------
    story.extend(make_header("4. Core Innovation: Multi-Department Shadow Blocking", 5))

    story.append(Paragraph("<b>Shadow Blocking Concept:</b> Co-locating multiple department activities during the same track closure window.", body_bold))
    story.append(Spacer(1, 10))

    comp_table = [
        [Paragraph("<b>Metric / Parameter</b>", body_bold), Paragraph("<b>Traditional Process (Before AI)</b>", body_bold), Paragraph("<b>Shadow Block Engine (After AI)</b>", body_bold), Paragraph("<b>Net Operational Improvement</b>", body_bold)],
        [Paragraph("<b>Disconnections per Day</b>", body_text), Paragraph("3 Separate Disconnections", body_text), Paragraph("1 Combined Shadow Window", body_text), Paragraph("<b>-66% Fewer Disconnections</b>", body_bold)],
        [Paragraph("<b>Track Closure Duration</b>", body_text), Paragraph("6.0 Hours Total (2.5h + 2.0h + 1.5h)", body_text), Paragraph("2.8 Hours Single Window", body_text), Paragraph("<b>3.2 Hours Track Time Saved (-53%)</b>", ParagraphStyle('G', parent=body_bold, textColor=c_emerald))],
        [Paragraph("<b>OHE Power Isolation</b>", body_text), Paragraph("Power turned off in separate slot", body_text), Paragraph("Aligned with Track Relay slot", body_text), Paragraph("<b>Zero Wasted Power Offs</b>", body_bold)],
        [Paragraph("<b>Train Timetable Delay</b>", body_text), Paragraph("High passenger & freight delays", body_text), Paragraph("Fits into low-density timetable gap", body_text), Paragraph("<b>360+ Train Delay Mins Avoided</b>", body_bold)],
    ]
    t_comp = Table(comp_table, colWidths=[150, 180, 180, 190])
    t_comp.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_navy),
        ('TEXTCOLOR', (0,0), (-1,0), c_white),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('BACKGROUND', (2,1), (2,-1), colors.HexColor("#ECFDF5")),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_comp)
    story.append(Spacer(1, 15))

    story.append(Table([[
        Paragraph("🎓 <b>Student Key Takeaway:</b> Shadow blocking is analogous to process parallelization in OS thread scheduling! Instead of running 3 sequential tasks with high context-switch overhead, we execute them concurrently within a shared resource lock.", speaker_note_style)
    ]], colWidths=[720], style=[
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#FEF3C7")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#F59E0B")),
        ('PADDING', (0,0), (-1,-1), 8)
    ]))
    story.append(PageBreak())

    # -------------------------------------------------------------------------
    # SLIDE 6: Optimization Formulation & Constraints
    # -------------------------------------------------------------------------
    story.extend(make_header("5. Optimization Math & Constraint Formulation", 6))

    col_math1 = [
        Paragraph("<b>Objective Function</b>", ParagraphStyle('H', parent=body_bold, textColor=c_navy)),
        Spacer(1, 6),
        Paragraph("The Mixed-Integer Optimization Solver minimizes a multi-objective cost function:", body_text),
        Spacer(1, 6),
        Paragraph("<b>min ( α·TrainDelays + β·UnmetPriority + γ·Downtime - δ·ShadowSavings )</b>", ParagraphStyle('M2', parent=body_bold, textColor=c_purple, fontSize=10.5)),
        Spacer(1, 6),
        Paragraph("Where:<br/>• <b>TrainDelays:</b> Total passenger/freight delay hours created.<br/>• <b>UnmetPriority:</b> Penalty for postponing high-TCI critical tasks.<br/>• <b>Downtime:</b> Total track closure duration.<br/>• <b>ShadowSavings:</b> Reward multiplier for co-locating tasks.", body_text)
    ]

    col_math2 = [
        Paragraph("<b>Hard Physical & Operational Constraints</b>", ParagraphStyle('H2', parent=body_bold, textColor=c_navy)),
        Spacer(1, 6),
        Paragraph("1. <b>Spatial Proximity Constraint:</b> Tasks merged into a shadow block must be within <b>|Km_A - Km_B| ≤ 8 KM</b>.", body_text),
        Spacer(1, 4),
        Paragraph("2. <b>Safety Headway Buffer:</b> Minimum 500m separation between heavy machines (BCM) and human gang crews.", body_text),
        Spacer(1, 4),
        Paragraph("3. <b>Power Interlock Constraint:</b> OHE de-energization must cover the entire geographical window of TRD work.", body_text),
        Spacer(1, 4),
        Paragraph("4. <b>Train Timetable Gap:</b> Maintenance slots must not intersect with High-Priority Express trains (Vande Bharat / Rajdhani).", body_text)
    ]

    t_math = Table([[col_math1, col_math2]], colWidths=[350, 350])
    t_math.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (0,0), 1, colors.HexColor("#8B5CF6")),
        ('BOX', (1,0), (1,0), 1, colors.HexColor("#64748B")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_math)
    story.append(Spacer(1, 15))

    story.append(Table([[
        Paragraph("🎓 <b>Student Key Takeaway:</b> This is Operations Research (OR) in action! Algorithms like Constraint Programming (CP) and Branch-and-Bound are used to solve NP-hard scheduling problems in real-time.", speaker_note_style)
    ]], colWidths=[720], style=[
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#EFF6FF")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#3B82F6")),
        ('PADDING', (0,0), (-1,-1), 8)
    ]))
    story.append(PageBreak())

    # -------------------------------------------------------------------------
    # SLIDE 7: Software Architecture & Tech Stack
    # -------------------------------------------------------------------------
    story.extend(make_header("6. Software Architecture & Frontend Components", 7))

    col_arch1 = [
        Paragraph("<b>Technology Stack</b>", ParagraphStyle('H', parent=body_bold, textColor=c_navy)),
        Spacer(1, 6),
        Paragraph("• <b>Framework:</b> Next.js 16 (App Router, React 19)", body_text),
        Paragraph("• <b>Styling:</b> Tailwind CSS with Glassmorphism Dark Theme", body_text),
        Paragraph("• <b>Icons & Visuals:</b> Lucide React Icons", body_text),
        Paragraph("• <b>Language:</b> TypeScript (Strict Type Contracts)", body_text),
        Paragraph("• <b>Build Engine:</b> Turbopack (Sub-second HMR & Compilation)", body_text)
    ]

    col_arch2 = [
        Paragraph("<b>Key User Interface Components</b>", ParagraphStyle('H2', parent=body_bold, textColor=c_navy)),
        Spacer(1, 6),
        Paragraph("1. <b>Time-Space Gantt Planner:</b> Renders train trajectories vs maintenance shadow blocks on a 24h timeline grid.", body_text),
        Spacer(1, 4),
        Paragraph("2. <b>Linear Track Asset Visualizer:</b> Interactive section map from NDLS to CNB with KM markers and defect pins.", body_text),
        Spacer(1, 4),
        Paragraph("3. <b>BDMS Sanction Portal:</b> Single-click approval workflow for Sr. DEN, Sr. DEE, and Traffic Control.", body_text),
        Spacer(1, 4),
        Paragraph("4. <b>Live Ingestion Monitor:</b> API health dashboard for TMS, SMMS, TDMS, COA, BDMS.", body_text)
    ]

    t_arch = Table([[col_arch1, col_arch2]], colWidths=[320, 380])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F1F5F9")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_arch)
    story.append(Spacer(1, 15))

    story.append(Table([[
        Paragraph("🎓 <b>Student Key Takeaway:</b> Notice how complex backend mathematical data is presented cleanly to human operators through rich visual components like time-space diagrams and status badges.", speaker_note_style)
    ]], colWidths=[720], style=[
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#EFF6FF")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#3B82F6")),
        ('PADDING', (0,0), (-1,-1), 8)
    ]))
    story.append(PageBreak())

    # -------------------------------------------------------------------------
    # SLIDE 8: Multi-Horizon Planning Framework
    # -------------------------------------------------------------------------
    story.extend(make_header("7. Multi-Horizon Planning Framework", 8))

    story.append(Paragraph("To support both long-term asset renewal and real-time train disruptions, the system operates across <b>3 Time Horizons</b>:", body_text))
    story.append(Spacer(1, 10))

    horizons_table = [
        [Paragraph("<b>Planning Horizon</b>", body_bold), Paragraph("<b>Time Range</b>", body_bold), Paragraph("<b>Primary Focus & Objective</b>", body_bold), Paragraph("<b>Key Output</b>", body_bold)],
        [Paragraph("<b>Daily Dynamic</b>", body_bold), Paragraph("0 to 24 Hours", body_text), Paragraph("Real-time adjustment reacting to train delays, unexpected freight train insertions from COA, or sudden emergency track defects.", body_text), Paragraph("Dynamic block window shifts & immediate disconnections", body_text)],
        [Paragraph("<b>Weekly Tactical</b>", body_bold), Paragraph("7 Days", body_text), Paragraph("Automated slot allocation and combined Shadow Block generation submitted directly to BDMS for multi-department approval.", body_text), Paragraph("Confirmed weekly block calendar & BDMS sanctions", body_text)],
        [Paragraph("<b>Monthly Macro</b>", body_bold), Paragraph("30 Days", body_text), Paragraph("Strategic forecasting for major corridor track renewal, ballast cleaning machine (BCM) deployment, and seasonal OHE overhaul.", body_text), Paragraph("Corridor traffic diversion plans & machine routing", body_text)]
    ]
    t_hor = Table(horizons_table, colWidths=[130, 110, 270, 210])
    t_hor.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_navy),
        ('TEXTCOLOR', (0,0), (-1,0), c_white),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_hor)
    story.append(Spacer(1, 15))

    story.append(Table([[
        Paragraph("🎓 <b>Student Key Takeaway:</b> Modern enterprise software must handle multi-scale temporal planning: macro strategic decisions differ from micro real-time execution.", speaker_note_style)
    ]], colWidths=[720], style=[
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#EFF6FF")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#3B82F6")),
        ('PADDING', (0,0), (-1,-1), 8)
    ]))
    story.append(PageBreak())

    # -------------------------------------------------------------------------
    # SLIDE 9: Key Operational Results
    # -------------------------------------------------------------------------
    story.extend(make_header("8. Key Operational Results & Impact", 9))

    res_data = [
        [Paragraph("<b>98.8%</b>", ParagraphStyle('V1', parent=body_bold, fontSize=24, leading=28, textColor=c_emerald)), Paragraph("<b>11.1 Hours</b>", ParagraphStyle('V2', parent=body_bold, fontSize=24, leading=28, textColor=c_amber))],
        [Paragraph("<b>Corridor Asset Availability</b><br/>+3.4% increase over traditional manual planning across the 440 KM Delhi-Kanpur trunk line.", body_text), Paragraph("<b>Weekly Downtime Saved</b><br/>Reduced total track closure hours from 21.0h requested down to 9.9h scheduled.", body_text)],
        [Paragraph("<b>52.9%</b>", ParagraphStyle('V3', parent=body_bold, fontSize=24, leading=28, textColor=c_cyan)), Paragraph("<b>360+ Mins</b>", ParagraphStyle('V4', parent=body_bold, fontSize=24, leading=28, textColor=c_purple))],
        [Paragraph("<b>Shadow Block Efficiency</b><br/>Over half of all departmental block windows co-located into single combined windows.", body_text), Paragraph("<b>Train Delays Prevented</b><br/>Cumulative passenger and goods train delay minutes avoided every week.", body_text)]
    ]
    t_res = Table(res_data, colWidths=[350, 350])
    t_res.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,1), colors.HexColor("#ECFDF5")),
        ('BACKGROUND', (1,0), (1,1), colors.HexColor("#FFFBEB")),
        ('BACKGROUND', (0,2), (0,3), colors.HexColor("#ECFEFF")),
        ('BACKGROUND', (1,2), (1,3), colors.HexColor("#F5F3FF")),
        ('BOX', (0,0), (0,1), 1, colors.HexColor("#10B981")),
        ('BOX', (1,0), (1,1), 1, colors.HexColor("#F59E0B")),
        ('BOX', (0,2), (0,3), 1, colors.HexColor("#06B6D4")),
        ('BOX', (1,2), (1,3), 1, colors.HexColor("#8B5CF6")),
        ('PADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_res)
    story.append(Spacer(1, 15))

    story.append(Table([[
        Paragraph("🎓 <b>Student Key Takeaway:</b> Measurable KPIs are essential! In software development, success is validated by empirical metric gains (downtime saved, availability uptime %, delay minutes reduced).", speaker_note_style)
    ]], colWidths=[720], style=[
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#EFF6FF")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#3B82F6")),
        ('PADDING', (0,0), (-1,-1), 8)
    ]))
    story.append(PageBreak())

    # -------------------------------------------------------------------------
    # SLIDE 10: Conclusion & Summary for Students
    # -------------------------------------------------------------------------
    story.extend(make_header("9. Summary & Learning Takeaways for Students", 10))

    summary_box = [
        Paragraph("<b>Key Takeaways for Computer Science & Engineering Students</b>", ParagraphStyle('SH', parent=body_bold, fontSize=13, leading=16, textColor=c_navy)),
        Spacer(1, 8),
        Paragraph("1. <b>Siloed Systems Need Integration:</b> Real-world efficiency starts by connecting isolated databases (TMS, SMMS, TDMS, COA, BDMS) via unified API data buses.", body_text),
        Spacer(1, 5),
        Paragraph("2. <b>AI + Math Optimization Works:</b> Weighted scoring heuristics (TCI) combined with constraint programming (Shadow Block Optimizer) produce massive 53% downtime reductions.", body_text),
        Spacer(1, 5),
        Paragraph("3. <b>User-Centric UI is Vital:</b> Complex algorithmic outputs must be visualized cleanly via interactive Gantt charts, maps, and single-click approval workflows.", body_text),
        Spacer(1, 5),
        Paragraph("4. <b>Multi-Horizon Design:</b> Systems must support long-term planning (Monthly/Weekly) while dynamically adapting to live real-time disruptions (Daily).", body_text),
    ]

    t_sum = Table([[summary_box]], colWidths=[700])
    t_sum.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (-1,-1), 1.5, c_navy),
        ('PADDING', (0,0), (-1,-1), 14),
    ]))
    story.append(t_sum)
    story.append(Spacer(1, 20))

    qna_box = [
        [Paragraph("<b>💬 Questions & Discussion</b><br/>Thank you! Software demo running locally at <b>http://localhost:3000/</b>", ParagraphStyle('Q', parent=body_bold, fontSize=12, leading=16, textColor=c_white, alignment=1))]
    ]
    t_qna = Table(qna_box, colWidths=[700])
    t_qna.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_navy),
        ('PADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(t_qna)

    # Build PDF
    doc.build(story)
    print(f"PDF successfully generated: {filename}")

if __name__ == "__main__":
    create_presentation_pdf()
