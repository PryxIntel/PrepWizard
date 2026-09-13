import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { gateQuestions, RawQuestionData } from './questions/gateQuestions.js';
import { rrbJeQuestions } from './questions/rrbJeQuestions.js';
import { sscJeQuestions } from './questions/sscJeQuestions.js';
import { rrbAlpQuestions } from './questions/rrbAlpQuestions.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding PrepWizard database with complete authentic exam suites & multi-year PYQ archives (2018-2024)...');

  // 1. Clean existing records in dependent tables for a clean, consistent seed
  await prisma.sessionQuestion.deleteMany({});
  await prisma.testSession.deleteMany({});
  await prisma.mistakeEntry.deleteMany({});
  await prisma.revisionCard.deleteMany({});
  await prisma.bookmark.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.subtopic.deleteMany({});
  await prisma.topic.deleteMany({});
  await prisma.subject.deleteMany({});

  // 2. Create Default Admin User
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('PrepWizard@2026', salt);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@prepwizard.com' },
    update: { passwordHash },
    create: {
      email: 'admin@prepwizard.com',
      passwordHash,
      name: 'System Admin',
      targetExam: 'GATE_CS',
      role: 'ADMIN',
      dailyStudyGoalMinutes: 120,
    },
  });

  console.log(`👤 Admin user ready: ${admin.email}`);

  // 3. Seed EXAMS & OFFICIAL PATTERNS
  const gateExam = await prisma.exam.upsert({
    where: { code: 'GATE_CS' },
    update: {},
    create: {
      code: 'GATE_CS',
      name: 'GATE Computer Science & Information Technology',
      category: 'Engineering Postgraduate',
      description: 'Graduate Aptitude Test in Engineering for Computer Science & IT. Conducted by IITs/IISc for M.Tech admissions and prestigious PSU recruitments.',
      patterns: {
        create: {
          title: 'Official GATE CS Pattern',
          durationMinutes: 180,
          totalQuestions: 65,
          defaultNegativeMarking: 0.33,
          isDefault: true,
          sectionsJson: JSON.stringify([
            { name: 'General Aptitude', questions: 10, marks: 15 },
            { name: 'Computer Science & Engineering', questions: 55, marks: 85 },
          ]),
        },
      },
    },
  });

  const rrbJeExam = await prisma.exam.upsert({
    where: { code: 'RRB_JE_EE' },
    update: {},
    create: {
      code: 'RRB_JE_EE',
      name: 'RRB JE Electrical Engineering (CBT 2)',
      category: 'Railway Recruitment Board',
      description: 'Railway Junior Engineer Technical Examination for Electrical & Allied Engineering cadre across Indian Railways.',
      patterns: {
        create: {
          title: 'Official RRB JE CBT-2 Pattern',
          durationMinutes: 120,
          totalQuestions: 150,
          defaultNegativeMarking: 0.33,
          isDefault: true,
          sectionsJson: JSON.stringify([
            { name: 'General Awareness & Science', questions: 50, marks: 50 },
            { name: 'Electrical & Allied Engineering', questions: 100, marks: 100 },
          ]),
        },
      },
    },
  });

  const sscJeExam = await prisma.exam.upsert({
    where: { code: 'SSC_JE_EE' },
    update: {},
    create: {
      code: 'SSC_JE_EE',
      name: 'SSC JE Electrical Engineering (Paper 1 & 2)',
      category: 'Staff Selection Commission',
      description: 'Junior Engineer Electrical for CPWD, MES, CWC and Central Government engineering departments.',
      patterns: {
        create: {
          title: 'Official SSC JE Paper-1 Pattern',
          durationMinutes: 120,
          totalQuestions: 200,
          defaultNegativeMarking: 0.25,
          isDefault: true,
          sectionsJson: JSON.stringify([
            { name: 'General Intelligence & Reasoning', questions: 50, marks: 50 },
            { name: 'General Awareness', questions: 50, marks: 50 },
            { name: 'Part A: Electrical Engineering', questions: 100, marks: 100 },
          ]),
        },
      },
    },
  });

  const rrbAlpExam = await prisma.exam.upsert({
    where: { code: 'RRB_ALP_EE' },
    update: {},
    create: {
      code: 'RRB_ALP_EE',
      name: 'RRB Assistant Loco Pilot (ALP)',
      category: 'Railway Recruitment Board',
      description: 'Assistant Loco Pilot & Technician Examination covering CBT-1 (Math, Reasoning, Science, General Awareness) and CBT-2 Part A & Part B Electrical Trade Theory.',
      patterns: {
        create: [
          {
            title: 'Official RRB ALP CBT-1 Pattern',
            durationMinutes: 60,
            totalQuestions: 75,
            defaultNegativeMarking: 0.33,
            isDefault: true,
            sectionsJson: JSON.stringify([
              { name: 'Mathematics', questions: 20, marks: 20 },
              { name: 'General Intelligence & Reasoning', questions: 25, marks: 25 },
              { name: 'General Science', questions: 20, marks: 20 },
              { name: 'General Awareness & Current Affairs', questions: 10, marks: 10 },
            ]),
          },
          {
            title: 'Official RRB ALP CBT-2 Part A & Part B Pattern',
            durationMinutes: 150,
            totalQuestions: 175,
            defaultNegativeMarking: 0.33,
            isDefault: false,
            sectionsJson: JSON.stringify([
              { name: 'Part A: Math, Reasoning, Basic Science & Engineering', questions: 100, marks: 100 },
              { name: 'Part B: Electrical Trade Theory', questions: 75, marks: 75 },
            ]),
          },
        ],
      },
    },
  });

  console.log('🏛️ Exams and Exam Patterns initialized.');

  // 4. SEED SUBJECTS & SYLLABUS TOPICS
  // GATE CS Subjects
  const gateSubjectsData = [
    {
      examId: gateExam.id,
      name: 'Operating Systems',
      code: 'GATE_CS_OS',
      order: 1,
      topics: ['Deadlock & Banker Algorithm', 'CPU Scheduling', 'Process Synchronization & Semaphores', 'Memory Management & Paging'],
    },
    {
      examId: gateExam.id,
      name: 'Algorithms & Data Structures',
      code: 'GATE_CS_ALGO',
      order: 2,
      topics: ['Asymptotic Analysis & Recurrences', 'Graph Algorithms & Shortest Path', 'Binary Search Trees & Heaps', 'Dynamic Programming & Greedy'],
    },
    {
      examId: gateExam.id,
      name: 'Database Management Systems',
      code: 'GATE_CS_DBMS',
      order: 3,
      topics: ['Relational Algebra & SQL', 'Functional Dependencies & Normalization', 'Transaction & Concurrency Control', 'B and B+ Trees Indexing'],
    },
    {
      examId: gateExam.id,
      name: 'Computer Networks',
      code: 'GATE_CS_CN',
      order: 4,
      topics: ['TCP Congestion Control & Flow Control', 'IP Addressing & Subnetting', 'Routing Algorithms', 'Application Layer & Data Link Protocols'],
    },
    {
      examId: gateExam.id,
      name: 'Computer Organization & Architecture',
      code: 'GATE_CS_COA',
      order: 5,
      topics: ['Pipelining & Hazards', 'Cache Memory Mapping & Misses', 'Instruction Formats & Addressing Modes'],
    },
    {
      examId: gateExam.id,
      name: 'Theory of Computation & Discrete Mathematics',
      code: 'GATE_CS_TOC',
      order: 6,
      topics: ['Finite Automata & Regular Expressions', 'Context-Free Languages & Pushdown Automata', 'Propositional & First-Order Logic', 'Graph Theory & Combinatorics'],
    },
  ];

  // RRB JE Subjects
  const rrbSubjectsData = [
    {
      examId: rrbJeExam.id,
      name: 'Electrical Machines',
      code: 'RRB_JE_MACHINES',
      order: 1,
      topics: ['Induction Motors (3-Phase & 1-Phase)', 'Transformers & Efficiency', 'DC Motors & Generators', 'Synchronous Machines & Alternators'],
    },
    {
      examId: rrbJeExam.id,
      name: 'Circuit Law & Network Theory',
      code: 'RRB_JE_CIRCUITS',
      order: 2,
      topics: ['Kirchhoff Laws & Nodal Analysis', 'Network Theorems (Thevenin, Norton, Superposition)', 'AC Fundamentals & Resonance', 'Magnetic Circuits & Inductance'],
    },
    {
      examId: rrbJeExam.id,
      name: 'Power Systems & Protection',
      code: 'RRB_JE_POWER',
      order: 3,
      topics: ['Transmission Lines & Corona', 'Switchgear & Protective Relays', 'Fault Analysis & Earthing', 'Generation Economics & Substation'],
    },
    {
      examId: rrbJeExam.id,
      name: 'Electrical Measurements & Instruments',
      code: 'RRB_JE_MEAS',
      order: 4,
      topics: ['PMMC and Moving Iron Meters', 'Two-Wattmeter Method for 3-Phase Power', 'AC and DC Bridges', 'Instrument Transformers (CT & PT)'],
    },
  ];

  // SSC JE Subjects
  const sscSubjectsData = [
    {
      examId: sscJeExam.id,
      name: 'Part A: Electrical Engineering',
      code: 'SSC_JE_ELEC',
      order: 1,
      topics: ['Basic Electrical & Circuit Concepts', 'Magnetic Circuits & AC Circuits', 'Electrical Machines & Transformers', 'Generation, Transmission & Distribution'],
    },
    {
      examId: sscJeExam.id,
      name: 'General Intelligence & Reasoning',
      code: 'SSC_JE_REASON',
      order: 2,
      topics: ['Analogies & Classification', 'Series & Coding-Decoding', 'Direction Sense & Syllogism', 'Blood Relations & Ranking Puzzles'],
    },
  ];

  // RRB ALP Subjects (Comprehensive CBT-1 and CBT-2 Subject Coverage)
  const alpSubjectsData = [
    {
      examId: rrbAlpExam.id,
      name: 'Mathematics',
      code: 'RRB_ALP_MATH',
      order: 1,
      topics: [
        'Number System, Fractions & Simplification',
        'Percentages, Profit & Loss and Discounts',
        'Ratio, Proportion, Partnership & Averages',
        'Time & Work, Pipes & Cisterns',
        'Speed, Time, Distance, Trains & Boats',
        'Simple & Compound Interest',
        'Mensuration (2D & 3D Solids) & Geometry',
        'Algebra, Polynomials & Equations',
        'Statistics, Mean, Median & Mode',
      ],
    },
    {
      examId: rrbAlpExam.id,
      name: 'General Intelligence & Reasoning',
      code: 'RRB_ALP_REASON',
      order: 2,
      topics: [
        'Number, Alphabetical & Alphanumeric Series',
        'Coding-Decoding & Letter Operations',
        'Analogies, Triads & Classification (Odd One Out)',
        'Direction Sense & Distance',
        'Blood Relations & Coded Family Tree',
        'Seating Arrangements & Linear/Circular Order',
        'Floor Puzzles & Day-Schedule Puzzles',
        'Syllogism & Statement-Conclusions',
        'Venn Diagrams & Logical Diagrams',
        'Mathematical Operations & Sign Interchanges',
        'Data Sufficiency',
      ],
    },
    {
      examId: rrbAlpExam.id,
      name: 'Basic Science & Engineering',
      code: 'RRB_ALP_SCIENCE',
      order: 3,
      topics: [
        'Units, Measurements & Physical Quantities',
        'Mass, Weight & Density',
        'Work, Power & Energy',
        'Speed, Velocity & Acceleration',
        'Heat, Temperature & Thermal Expansion',
        'Basic Electricity, Ohm Law & Resistance',
        'Light, Reflection, Refraction & Optics',
        'Sound Waves & Acoustics',
        'Chemistry, Chemical Reactions, Acids & Bases',
        'Biology, Human Physiology, Cells & Tissues',
        'Engineering Drawing, Projections & Instruments',
        'Occupational Safety, Health & Environment',
        'IT Literacy & Computer Fundamentals',
      ],
    },
    {
      examId: rrbAlpExam.id,
      name: 'General Awareness & Current Affairs',
      code: 'RRB_ALP_GA',
      order: 4,
      topics: [
        'Indian Constitution, Polity & Governance',
        'Current Affairs, National & International Events',
        'Science & Technology Developments',
        'Sports, Awards & Honors',
        'General Knowledge & Environment',
      ],
    },
    {
      examId: rrbAlpExam.id,
      name: 'Electrical Trade Theory',
      code: 'RRB_ALP_TRADE',
      order: 5,
      topics: [
        'Safety Practices, First Aid, Hand Tools & Workshop',
        'Ohm Law, Kirchhoff Laws & DC Resistance Circuits',
        'Cells, Batteries & Chemical Effects of Current',
        'Magnetism, Electromagnetism & Inductors',
        'AC Fundamentals, Single-Phase & 3-Phase Circuits',
        'DC Generators & DC Motors',
        'Transformers (Single & 3-Phase)',
        'Alternators & Synchronous Machines',
        'Power Electronics (SCR, TRIAC, UJT, MOSFET)',
        'Earthing, Grounding, Fuses & Circuit Breakers (MCB, ELCB)',
        'Electrical Measuring Instruments (Megger, Multimeter, Ohmmeter)',
        'Engineering Drawing & Standards (BIS SP 46)',
      ],
    },
  ];

  const allSubjectsData = [
    ...gateSubjectsData,
    ...rrbSubjectsData,
    ...sscSubjectsData,
    ...alpSubjectsData,
  ];

  // Map to hold created subjects and topics by code
  const subjectMap: Record<string, { id: string; examId: string; topics: { id: string; name: string }[] }> = {};

  for (const s of allSubjectsData) {
    const createdSubject = await prisma.subject.create({
      data: {
        examId: s.examId,
        name: s.name,
        code: s.code,
        order: s.order,
        topics: {
          create: s.topics.map((tName, idx) => ({
            name: tName,
            order: idx + 1,
          })),
        },
      },
      include: { topics: true },
    });

    subjectMap[s.code] = {
      id: createdSubject.id,
      examId: s.examId,
      topics: createdSubject.topics,
    };
  }

  console.log(`📚 Seeded ${Object.keys(subjectMap).length} subjects and complete topic trees.`);

  // 5. HELPER FUNCTION TO INSERT QUESTIONS FROM DATA ARRAYS
  const insertQuestions = async (questionsList: RawQuestionData[], examName: string) => {
    let count = 0;
    for (const q of questionsList) {
      const subject = subjectMap[q.subjectCode];
      if (!subject) {
        console.warn(`Subject ${q.subjectCode} not found for question: ${q.questionText.slice(0, 30)}`);
        continue;
      }

      // Find matching topic by keyword or fallback to first topic
      const matchingTopic = subject.topics.find((t) =>
        t.name.toLowerCase().includes(q.topicKeyword.toLowerCase())
      ) || subject.topics[0];

      await prisma.question.create({
        data: {
          examId: subject.examId,
          subjectId: subject.id,
          topicId: matchingTopic.id,
          year: q.year,
          shift: q.shift || 'Shift 1',
          questionType: q.questionType,
          difficulty: q.difficulty,
          questionText: q.questionText,
          optionsJson: JSON.stringify(q.options),
          correctAnswersJson: JSON.stringify(q.correctAnswers),
          marks: q.marks,
          negativeMarks: q.negativeMarks,
          avgExpectedSeconds: q.avgExpectedSeconds,
          explanation: q.explanation,
          formulaConcept: q.formulaConcept,
          shortcutTrick: q.shortcutTrick,
          commonMistake: q.commonMistake,
          isPYQ: true,
          sourceRef: q.sourceRef,
        },
      });
      count++;
    }
    console.log(`✅ Seeded ${count} authentic PYQs for ${examName}`);
    return count;
  };

  // 6. INSERT ALL AUTHENTIC PYQ SUITES
  const gCount = await insertQuestions(gateQuestions, 'GATE Computer Science (2018-2024)');
  const rCount = await insertQuestions(rrbJeQuestions, 'RRB JE Electrical (2019-2024)');
  const sCount = await insertQuestions(sscJeQuestions, 'SSC JE Electrical (2019-2024)');
  const aCount = await insertQuestions(rrbAlpQuestions, 'RRB ALP CBT-1 & CBT-2 Authentic Papers (400 PYQs)');

  const totalQuestions = gCount + rCount + sCount + aCount;
  console.log(`\n🎉 Total Authentic PYQs successfully seeded: ${totalQuestions}`);
  console.log('🚀 PrepWizard is fully charged with complete authentic multi-year PYQs!');
}

main()
  .catch((e) => {
    console.error('Error seeding DB:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
