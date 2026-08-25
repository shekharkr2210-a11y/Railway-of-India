import sys
import os
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def create_hackathon_presentation_pdf(filename="AI_Block_Planner_Hackathon_Presentation.pdf"):
    # Page setup: Landscape Letter (11 x 8.5 inches = 792 x 612 pts)
    # Margins: 36 pt (0.5 inch) -> Printable width = 720 pt, printable height = 540 pt
    doc = SimpleDocTemplate(
        filename,
        pagesize=landscape(letter),
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Premium Color Palette matching Indian Railways & Enterprise Dark Theme UI
    c_navy = colors.HexColor("#0F172A")        # Slate 900
    c_dark_card = colors.HexColor("#1E293B")   # Slate 800
    c_amber = colors.HexColor("#F59E0B")       # Amber 500
    c_amber_light = colors.HexColor("#FEF3C7") # Amber 100
    c_emerald = colors.HexColor("#10B981")     # Emerald 500
    c_emerald_light = colors.HexColor("#D1FAE5")# Emerald 100
    c_red = colors.HexColor("#EF4444")         # Red 500
    c_red_light = colors.HexColor("#FEE2E2")   # Red 100
    c_cyan = colors.HexColor("#06B6D4")        # Cyan 500
    c_blue = colors.HexColor("#3B82F6")        # Blue 500
    c_blue_light = colors.HexColor("#DBEAFE")  # Blue 100
    c_purple = colors.HexColor("#8B5CF6")      # Purple 500
    c_light_bg = colors.HexColor("#F8FAFC")    # Slate 50
    c_slate_text = colors.HexColor("#334155")  # Slate 700
    c_white = colors.white

    # Custom Typography Styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=30,
        textColor=c_navy,
        alignment=0
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
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
        spaceAfter=8
    )

    body_bold = ParagraphStyle(
        'BodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=c_slate_text
    )

    body_text = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=c_slate_text
    )

    speaker_note_style = ParagraphStyle(
        'SpeakerNote',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=12.5,
        textColor=colors.HexColor("#78350F") # Dark amber for readable note text
    )

    story = []

    def make_header(title, slide_num):
        header_table = Table(
            [[
                Paragraph(f"<b>{title}</b>", slide_title_style),
                Paragraph(f"<font color='#64748B'><b>Hackathon Pitch Deck | Slide {slide_num} / 10</b></font>", ParagraphStyle('R', parent=body_text, alignment=2))
            ]],
            colWidths=[520, 200]
        )
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ]))
        return [header_table, HRFlowable(width="100%", thickness=1.5, color=c_amber, spaceAfter=10)]

    def make_student_note(speech_text):
        note_content = [
            Paragraph(f"<b>🗣️ Student Pitch to Hackathon Coordinator:</b><br/>\"{speech_text}\"", speaker_note_style)
        ]
        t = Table([note_content], colWidths=[720])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), c_amber_light),
            ('BOX', (0,0), (-1,-1), 1, c_amber),
            ('PADDING', (0,0), (-1,-1), 8),
        ]))
        return t

    # -------------------------------------------------------------------------
    # SLIDE 1: Title & Elevator Pitch (Student to Coordinator)
    # -------------------------------------------------------------------------
    story.append(Paragraph("<b>HACKATHON FINAL PRESENTATION • STUDENT PROJECT DEMO</b>", subtitle_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("<b>AI-Powered Automatic Block & Shadow Block Planning System</b>", title_style))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Transforming Multi-Department Indian Railways Infrastructure Maintenance via AI Task Criticality & Mixed-Integer Shadow Block Optimization", ParagraphStyle('Sub2', parent=body_text, fontSize=11, leading=15, textColor=c_slate_text)))
    story.append(Spacer(1, 12))

    cover_data = [
        [Paragraph("<b>Presenter:</b> Engineering & CS Student Team", body_bold), Paragraph("<b>Target Evaluator:</b> Hackathon Coordinator & Jury Panel", body_bold)],
        [Paragraph("<b>Track / Domain:</b> AI for Smart Infrastructure & Logistics", body_bold), Paragraph("<b>Tech Stack:</b> Next.js 16, React 19, TypeScript, REST API, MILP Engine", body_bold)],
        [Paragraph("<b>Problem Scope:</b> Indian Railways Maintenance Silos (TMS, SMMS, TDMS)", body_bold), Paragraph("<b>Live Prototype:</b> http://localhost:3000/ (Active Next.js Server)", body_bold)]
    ]
    t_cover = Table(cover_data, colWidths=[360, 360])
    t_cover.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F1F5F9")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_cover)
    story.append(Spacer(1, 14))

    story.append(make_student_note(
        "Respected Hackathon Coordinator and Honorable Judges! Today our team is excited to present our production-ready software solution for Indian Railways. Indian Railways is the 4th largest network in the world, but track maintenance (TMS), signaling (SMMS), and electrification (TDMS) operate in isolated departmental silos. Our AI-driven software unifies these independent requests into optimized 'Shadow Blocks'—cutting total track downtime by over 50% while protecting train timetables!"
    ))
    story.append(PageBreak())

    # -------------------------------------------------------------------------
    # SLIDE 2: The Hackathon Challenge & Problem Statement
    # -------------------------------------------------------------------------
    story.extend(make_header("1. The Hackathon Challenge: Multi-Department Maintenance Silos", 2))

    col1 = [
        Paragraph("<b>Current Decentralized Manual Process</b>", ParagraphStyle('H', parent=body_bold, textColor=c_red, fontSize=11)),
        Spacer(1, 4),
        Paragraph("• <b>Civil Engineering (TMS):</b> Inspects rails & track geometry. Requests ~2.5h track closure for rail replacement.", body_text),
        Spacer(1, 3),
        Paragraph("• <b>TRD Electrical (TDMS):</b> Inspects 25kV OHE overhead wires. Requests ~2.0h power block for wire alignment.", body_text),
        Spacer(1, 3),
        Paragraph("• <b>Signals (SMMS):</b> Overhauls point machines & axle counters. Requests ~1.5h disconnection.", body_text),
        Spacer(1, 3),
        Paragraph("• <b>Manual Submissions via BDMS:</b> Applications submitted independently without temporal or spatial co-location.", body_text),
    ]

    col2 = [
        Paragraph("<b>Severe Systemic & Operational Consequences</b>", ParagraphStyle('H2', parent=body_bold, textColor=c_navy, fontSize=11)),
        Spacer(1, 4),
        Paragraph("❌ <b>Fragmented Track Closures:</b> 3 separate shutdowns per day on the exact same corridor section.", body_text),
        Spacer(1, 3),
        Paragraph("❌ <b>6.0 Hours Total Track Downtime:</b> Corridor remains blocked for trains across multiple independent windows.", body_text),
        Spacer(1, 3),
        Paragraph("❌ <b>Cascading Train Delays:</b> High-priority trains (Vande Bharat, Rajdhani, Goods) face severe delays.", body_text),
        Spacer(1, 3),
        Paragraph("❌ <b>Wasted Labor Uptime:</b> Signal workers wait for track access while track engineers finish nearby.", body_text),
    ]

    t_s2 = Table([[col1, col2]], colWidths=[350, 350])
    t_s2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), c_red_light),
        ('BACKGROUND', (1,0), (1,0), c_light_bg),
        ('BOX', (0,0), (0,0), 1, colors.HexColor("#FCA5A5")),
        ('BOX', (1,0), (1,0), 1, colors.HexColor("#CBD5E1")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_s2)
    story.append(Spacer(1, 12))

    story.append(make_student_note(
        "Coordinator, to understand the core problem: Imagine 3 different repair crews needing to fix the exact same 5 km stretch of track today. Currently, they apply separately, forcing traffic controllers to shut down the track 3 separate times for a total of 6 hours! That is a massive operational failure. Our hackathon challenge was to build an intelligent algorithm that automatically merges these into single shared maintenance slots."
    ))
    story.append(PageBreak())

    # -------------------------------------------------------------------------
    # SLIDE 3: System Overview & Data Integration Layer
    # -------------------------------------------------------------------------
    story.extend(make_header("2. Software Solution & Legacy Systems Integration Layer", 3))

    story.append(Paragraph("Our system connects 5 isolated railway legacy databases into a <b>Unified Normalized Data Bus</b> via REST APIs:", body_text))
    story.append(Spacer(1, 8))

    ingest_table_data = [
        [Paragraph("<b>Source System</b>", body_bold), Paragraph("<b>Department</b>", body_bold), Paragraph("<b>Data Ingested</b>", body_bold), Paragraph("<b>Role in AI Optimization Engine</b>", body_bold)],
        [Paragraph("<b>TMS</b>", body_bold), Paragraph("Civil Engineering", body_text), Paragraph("Rail fractures (IMR), Track geometry defects", body_text), Paragraph("Calculates defect urgency & KM location", body_text)],
        [Paragraph("<b>SMMS</b>", body_bold), Paragraph("Signal & Telecom", body_text), Paragraph("Point machine wear, axle counter calibration", body_text), Paragraph("Interlocking & signal safety dependency check", body_text)],
        [Paragraph("<b>TDMS</b>", body_bold), Paragraph("Electrical TRD", body_text), Paragraph("OHE wire sag, insulator washing, power block", body_text), Paragraph("Triggers 25kV power isolation alignment", body_text)],
        [Paragraph("<b>COA</b>", body_bold), Paragraph("Control Office", body_text), Paragraph("Train timetables, freight forecasts, live delays", body_text), Paragraph("Identifies low-density traffic gap windows", body_text)],
        [Paragraph("<b>BDMS</b>", body_bold), Paragraph("Division Control", body_text), Paragraph("Block demand applications & approval status", body_text), Paragraph("Executes multi-stage electronic sanctions", body_text)]
    ]
    t_ingest = Table(ingest_table_data, colWidths=[80, 120, 260, 240])
    t_ingest.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_navy),
        ('TEXTCOLOR', (0,0), (-1,0), c_white),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_ingest)
    story.append(Spacer(1, 10))

    story.append(make_student_note(
        "Coordinator, a critical architectural decision in our hackathon project was not trying to replace existing Indian Railways legacy software. Instead, we built a data normalization gateway that ingests heterogenous data from TMS, SMMS, TDMS, COA, and BDMS into a unified JSON API schema: { sectionId, startKm, endKm, durationHours, urgencyScore }."
    ))
    story.append(PageBreak())

    # -------------------------------------------------------------------------
    # SLIDE 4: AI Core Part 1 - Task Criticality Index Algorithm
    # -------------------------------------------------------------------------
    story.extend(make_header("3. AI Algorithm Core: Task Criticality Index (TCI)", 4))

    col_tci1 = [
        Paragraph("<b>Mathematical Criticality Model</b>", ParagraphStyle('H', parent=body_bold, textColor=c_navy, fontSize=11)),
        Spacer(1, 6),
        Paragraph("Every maintenance defect is evaluated to calculate a <b>TCI Score (0 to 100)</b>:", body_text),
        Spacer(1, 6),
        Paragraph("<b>TCI = w₁·Severity + w₂·Overdue + w₃·SpeedImpact + w₄·PowerFactor</b>", ParagraphStyle('M', parent=body_bold, textColor=c_amber, fontSize=10.5)),
        Spacer(1, 6),
        Paragraph("• <b>Defect Severity (w₁):</b> CRITICAL (45 pts), HIGH (35 pts), MEDIUM (25 pts).", body_text),
        Paragraph("• <b>Overdue Days (w₂):</b> +3.5 pts per day overdue (max 30 pts).", body_text),
        Paragraph("• <b>Speed Restriction Impact (w₃):</b> +0.4 pts per km/h speed reduction avoided.", body_text),
        Paragraph("• <b>Power Block Requirement (w₄):</b> +5 pts if 25kV OHE isolation needed.", body_text),
    ]

    col_tci2 = [
        Paragraph("<b>Why Algorithmic Ranking Matters</b>", ParagraphStyle('H2', parent=body_bold, textColor=c_emerald, fontSize=11)),
        Spacer(1, 6),
        Paragraph("• <b>Prevents Catastrophic Fractures:</b> High-TCI rail flaws (Score > 90) receive instant scheduling priority before structural failure occurs.", body_text),
        Spacer(1, 5),
        Paragraph("• <b>Restores Line Speed Uptime:</b> Tasks causing Temporary Speed Restrictions (TSRs down to 30 km/h) are prioritized to restore 130 km/h line capacity.", body_text),
        Spacer(1, 5),
        Paragraph("• <b>Eliminates Human Bias & Overdue Backlog:</b> Tasks automatically escalate in score every 24 hours until scheduled.", body_text),
    ]

    t_tci = Table([[col_tci1, col_tci2]], colWidths=[360, 340])
    t_tci.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), colors.HexColor("#FFFBEB")),
        ('BACKGROUND', (1,0), (1,0), colors.HexColor("#ECFDF5")),
        ('BOX', (0,0), (0,0), 1, c_amber),
        ('BOX', (1,0), (1,0), 1, c_emerald),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_tci)
    story.append(Spacer(1, 10))

    story.append(make_student_note(
        "Coordinator, in computer science terms, TCI is a weighted multi-criteria heuristic scoring function. With thousands of defect reports logged across 18 zones every day, human controllers cannot manually determine which defect is most dangerous. TCI ranks every single task objectively in milliseconds!"
    ))
    story.append(PageBreak())

    # -------------------------------------------------------------------------
    # SLIDE 5: AI Core Part 2 - The Shadow Block Innovation
    # -------------------------------------------------------------------------
    story.extend(make_header("4. Breakthrough Innovation: Multi-Department Shadow Blocking", 5))

    story.append(Paragraph("<b>Shadow Blocking Concept:</b> Co-locating multiple departmental tasks within the same spatial track closure window.", body_bold))
    story.append(Spacer(1, 8))

    comp_table = [
        [Paragraph("<b>Metric / Parameter</b>", body_bold), Paragraph("<b>Traditional Process (Before AI)</b>", body_bold), Paragraph("<b>Shadow Block Engine (After AI)</b>", body_bold), Paragraph("<b>Net Operational Improvement</b>", body_bold)],
        [Paragraph("<b>Track Disconnections / Day</b>", body_text), Paragraph("3 Separate Disconnections", body_text), Paragraph("1 Combined Shadow Window", body_text), Paragraph("<b>-66% Fewer Closures</b>", body_bold)],
        [Paragraph("<b>Track Closure Duration</b>", body_text), Paragraph("6.0 Hours Total (2.5h + 2.0h + 1.5h)", body_text), Paragraph("2.8 Hours Single Window", body_text), Paragraph("<b>3.2 Hours Track Time Saved (-53%)</b>", ParagraphStyle('G', parent=body_bold, textColor=c_emerald))],
        [Paragraph("<b>25kV OHE Power Isolation</b>", body_text), Paragraph("Power turned off in separate slot", body_text), Paragraph("Aligned with Track Relay slot", body_text), Paragraph("<b>Zero Wasted Power Offs</b>", body_bold)],
        [Paragraph("<b>Train Timetable Delay</b>", body_text), Paragraph("High passenger & freight delays", body_text), Paragraph("Fits into low-density timetable gap", body_text), Paragraph("<b>360+ Train Delay Mins Avoided</b>", body_bold)],
    ]
    t_comp = Table(comp_table, colWidths=[150, 180, 180, 190])
    t_comp.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_navy),
        ('TEXTCOLOR', (0,0), (-1,0), c_white),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('BACKGROUND', (2,1), (2,-1), colors.HexColor("#ECFDF5")),
        ('PADDING', (0,0), (-1,-1), 7),
    ]))
    story.append(t_comp)
    story.append(Spacer(1, 10))

    story.append(make_student_note(
        "Coordinator, Shadow Blocking is our crowning innovation! Think of it like thread concurrency in Operating Systems: instead of running 3 sequential tasks with heavy context-switch penalties (closing the track 3 times), we acquire the track lock ONCE and execute track, signal, and overhead wire maintenance in parallel. This single optimization saves over 3 hours of track closure time daily!"
    ))
    story.append(PageBreak())

    # -------------------------------------------------------------------------
    # SLIDE 6: Optimization Math & Operational Constraints
    # -------------------------------------------------------------------------
    story.extend(make_header("5. Optimization Mathematics & Operational Constraints", 6))

    col_math1 = [
        Paragraph("<b>Mixed-Integer Objective Function</b>", ParagraphStyle('H', parent=body_bold, textColor=c_navy, fontSize=11)),
        Spacer(1, 5),
        Paragraph("The AI Solver minimizes a multi-objective cost function:", body_text),
        Spacer(1, 5),
        Paragraph("<b>min ( α·TrainDelays + β·UnmetPriority + γ·Downtime - δ·ShadowSavings )</b>", ParagraphStyle('M2', parent=body_bold, textColor=c_purple, fontSize=10)),
        Spacer(1, 5),
        Paragraph("Where:<br/>• <b>TrainDelays:</b> Total passenger/freight delay hours created.<br/>• <b>UnmetPriority:</b> Penalty for postponing high-TCI critical defects.<br/>• <b>Downtime:</b> Total track closure duration.<br/>• <b>ShadowSavings:</b> Reward multiplier for co-locating tasks.", body_text)
    ]

    col_math2 = [
        Paragraph("<b>Hard Physical Safety Constraints</b>", ParagraphStyle('H2', parent=body_bold, textColor=c_navy, fontSize=11)),
        Spacer(1, 5),
        Paragraph("1. <b>Spatial Proximity Constraint:</b> Tasks merged into a shadow block must be within <b>|Km_A - Km_B| ≤ 8 KM</b>.", body_text),
        Spacer(1, 3),
        Paragraph("2. <b>Safety Headway Buffer:</b> Minimum 500m separation between heavy machinery (BCM) and human gang crews.", body_text),
        Spacer(1, 3),
        Paragraph("3. <b>Power Interlock Constraint:</b> OHE de-energization must span the entire geographical window of TRD work.", body_text),
        Spacer(1, 3),
        Paragraph("4. <b>Timetable Protection:</b> No block allocation during high-priority Vande Bharat / Rajdhani passings.", body_text)
    ]

    t_math = Table([[col_math1, col_math2]], colWidths=[350, 350])
    t_math.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_light_bg),
        ('BOX', (0,0), (0,0), 1, c_purple),
        ('BOX', (1,0), (1,0), 1, colors.HexColor("#64748B")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_math)
    story.append(Spacer(1, 10))

    story.append(make_student_note(
        "Coordinator, safety in rail operations is non-negotiable! That's why our optimization algorithm enforces strict mathematical constraints: spatial proximity within 8 km, 500m safety buffers between machines and human workers, and total protection of premium express train schedules."
    ))
    story.append(PageBreak())

    # -------------------------------------------------------------------------
    # SLIDE 7: Multi-Horizon Planning & RailTel Security Layer
    # -------------------------------------------------------------------------
    story.extend(make_header("6. Multi-Horizon Planning & Enterprise Security Layer", 7))

    col_hor1 = [
        Paragraph("<b>Multi-Horizon Planning Framework</b>", ParagraphStyle('H', parent=body_bold, textColor=c_navy, fontSize=11)),
        Spacer(1, 4),
        Paragraph("• <b>Daily Dynamic (0-24h):</b> Real-time schedule shifts reacting to live train delays & emergency rail defects.", body_text),
        Spacer(1, 3),
        Paragraph("• <b>Weekly Tactical (7 Days):</b> Automated Shadow Block calendar generation submitted to BDMS for multi-department approval.", body_text),
        Spacer(1, 3),
        Paragraph("• <b>Monthly Strategic (30 Days):</b> Macro corridor track renewal & ballast cleaning machine (BCM) routing.", body_text)
    ]

    col_hor2 = [
        Paragraph("<b>RailTel Security & Audit Compliance</b>", ParagraphStyle('H2', parent=body_bold, textColor=c_navy, fontSize=11)),
        Spacer(1, 4),
        Paragraph("• <b>HMAC-SHA256 Signatures:</b> All sanctioned block windows generate cryptographic digital signatures for tampering protection.", body_text),
        Spacer(1, 3),
        Paragraph("• <b>Role-Based Access Control (RBAC):</b> Enterprise hierarchy support across Board HQ, Zonal HQ, Divisional Control, and Field Engineers.", body_text),
        Spacer(1, 3),
        Paragraph("• <b>Immutable Audit Logging:</b> Live audit trail recording IP addresses, timestamps, and sanction actions.", body_text)
    ]

    t_hor = Table([[col_hor1, col_hor2]], colWidths=[350, 350])
    t_hor.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_light_bg),
        ('BOX', (0,0), (0,0), 1, c_blue),
        ('BOX', (1,0), (1,0), 1, c_emerald),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_hor)
    story.append(Spacer(1, 10))

    story.append(make_student_note(
        "Coordinator, in enterprise software for critical national infrastructure, security and temporal flexibility are paramount. Our platform provides 3 distinct planning horizons (Daily, Weekly, Monthly) and secures every sanction transaction with RailTel HMAC-SHA256 cryptographic signatures and live audit logs."
    ))
    story.append(PageBreak())

    # -------------------------------------------------------------------------
    # SLIDE 8: Software Features & UI Walkthrough
    # -------------------------------------------------------------------------
    story.extend(make_header("7. Live Software Features & Interactive UI Walkthrough", 8))

    col_ui1 = [
        Paragraph("<b>Core Visual Modules</b>", ParagraphStyle('H', parent=body_bold, textColor=c_navy, fontSize=11)),
        Spacer(1, 5),
        Paragraph("1. <b>Time-Space Gantt Chart:</b> Interactive 24-hour visual grid plotting train trajectories against maintenance shadow blocks.", body_text),
        Spacer(1, 3),
        Paragraph("2. <b>Linear Corridor Visualizer:</b> Section map (NDLS to CNB, 440 KM) displaying live defect markers & active block locations.", body_text),
        Spacer(1, 3),
        Paragraph("3. <b>BDMS Sanction Portal:</b> Single-click electronic sanction workflow for Sr. DEN, Sr. DEE, and Traffic Control.", body_text),
        Spacer(1, 3),
        Paragraph("4. <b>Live Ingestion Monitor:</b> API health monitoring dashboard for TMS, SMMS, TDMS, COA, and BDMS gateways.", body_text)
    ]

    col_ui2 = [
        Paragraph("<b>Engineering Tech Stack</b>", ParagraphStyle('H2', parent=body_bold, textColor=c_navy, fontSize=11)),
        Spacer(1, 5),
        Paragraph("• <b>Frontend Core:</b> Next.js 16 (App Router, Turbopack, React 19)", body_text),
        Spacer(1, 3),
        Paragraph("• <b>Styling:</b> Modern Glassmorphism CSS with Dark Theme Palette", body_text),
        Spacer(1, 3),
        Paragraph("• <b>Icons & Visuals:</b> Lucide React Component Library", body_text),
        Spacer(1, 3),
        Paragraph("• <b>State Management:</b> React Hooks with Strict TypeScript Type Safety", body_text),
        Spacer(1, 3),
        Paragraph("• <b>Backend API:</b> Next.js REST API (`/api/optimize`, `/api/bdms/sanction`)", body_text)
    ]

    t_ui = Table([[col_ui1, col_ui2]], colWidths=[360, 340])
    t_ui.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_light_bg),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_ui)
    story.append(Spacer(1, 10))

    story.append(make_student_note(
        "Coordinator, complex mathematical outputs are useless if controllers cannot understand them! We built a high-performance Next.js 16 frontend featuring interactive Time-Space Gantt charts and linear corridor maps that make complex optimization schedules intuitive to operate in real-time control rooms."
    ))
    story.append(PageBreak())

    # -------------------------------------------------------------------------
    # SLIDE 9: Quantifiable Hackathon Results & Operational Impact
    # -------------------------------------------------------------------------
    story.extend(make_header("8. Validated Hackathon Results & Operational Impact", 9))

    res_data = [
        [Paragraph("<b>98.4%</b>", ParagraphStyle('V1', parent=body_bold, fontSize=22, leading=26, textColor=c_emerald)), Paragraph("<b>126 Hours</b>", ParagraphStyle('V2', parent=body_bold, fontSize=22, leading=26, textColor=c_amber))],
        [Paragraph("<b>Corridor Asset Availability</b><br/>+3.4% overall increase in line availability across the 440 KM Delhi-Kanpur trunk line.", body_text), Paragraph("<b>Track Downtime Saved / Week</b><br/>Reduced total track closure hours from 240h requested down to 114h scheduled.", body_text)],
        [Paragraph("<b>54.2%</b>", ParagraphStyle('V3', parent=body_bold, fontSize=22, leading=26, textColor=c_cyan)), Paragraph("<b>14,200 Mins</b>", ParagraphStyle('V4', parent=body_bold, fontSize=22, leading=26, textColor=c_purple))],
        [Paragraph("<b>Shadow Block Co-location Rate</b><br/>Over half of all departmental maintenance windows merged into unified slots.", body_text), Paragraph("<b>Train Delays Avoided / Week</b><br/>Cumulative passenger and goods train delay minutes prevented across all divisions.", body_text)]
    ]
    t_res = Table(res_data, colWidths=[350, 350])
    t_res.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,1), colors.HexColor("#ECFDF5")),
        ('BACKGROUND', (1,0), (1,1), colors.HexColor("#FFFBEB")),
        ('BACKGROUND', (0,2), (0,3), colors.HexColor("#ECFEFF")),
        ('BACKGROUND', (1,2), (1,3), colors.HexColor("#F5F3FF")),
        ('BOX', (0,0), (0,1), 1, c_emerald),
        ('BOX', (1,0), (1,1), 1, c_amber),
        ('BOX', (0,2), (0,3), 1, c_cyan),
        ('BOX', (1,2), (1,3), 1, c_purple),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_res)
    story.append(Spacer(1, 10))

    story.append(make_student_note(
        "Coordinator, our hackathon project is backed by concrete empirical data! In our simulated test across the 440 KM Delhi-Kanpur corridor, our AI engine achieved 54.2% shadow block co-location, saved 126 hours of track downtime per week, and prevented 14,200 minutes of cumulative train delays!"
    ))
    story.append(PageBreak())

    # -------------------------------------------------------------------------
    # SLIDE 10: Feasibility, Scalability & Final Hackathon Pitch
    # -------------------------------------------------------------------------
    story.extend(make_header("9. Feasibility, Scalability & Final Hackathon Pitch", 10))

    summary_box = [
        Paragraph("<b>Why Our Team & Solution Should Win This Hackathon</b>", ParagraphStyle('SH', parent=body_bold, fontSize=12, leading=15, textColor=c_navy)),
        Spacer(1, 6),
        Paragraph("1. <b>Fully Functional Prototype:</b> Built and running locally on Next.js 16 (`npm run dev`) with active REST API endpoints.", body_text),
        Spacer(1, 4),
        Paragraph("2. <b>National Enterprise Scalability:</b> Multi-tier scope selector supporting all 18 Zonal Railways and 68 Divisional Units.", body_text),
        Spacer(1, 4),
        Paragraph("3. <b>High ROI & Immediate Implementation:</b> Zero friction integration with legacy TMS/SMMS/TDMS via RailTel REST API gateway.", body_text),
        Spacer(1, 4),
        Paragraph("4. <b>Future Roadmap:</b> Ready for IoT track vibration sensor integration and GPS locomotive tracking.", body_text),
    ]

    t_sum = Table([[summary_box]], colWidths=[700])
    t_sum.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_light_bg),
        ('BOX', (0,0), (-1,-1), 1.5, c_navy),
        ('PADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_sum)
    story.append(Spacer(1, 12))

    qna_box = [
        [Paragraph("<b>🏆 Thank You Coordinator & Judges!</b><br/>Live Demo Available at <b>http://localhost:3000/</b> | Ready for Q&A", ParagraphStyle('Q', parent=body_bold, fontSize=11, leading=15, textColor=c_white, alignment=1))]
    ]
    t_qna = Table(qna_box, colWidths=[700])
    t_qna.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_navy),
        ('PADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_qna)

    # Build PDF
    doc.build(story)
    print(f"PDF successfully generated: {filename}")

if __name__ == "__main__":
    create_hackathon_presentation_pdf()
