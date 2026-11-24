/**
 * Development seed — usage: `cd packages/backend && node prisma/seed.js`.
 * Seeds a small working set for local dev: admin, a tutor, a parent+student
 * pair, sample classes/arms, a course with modules/lessons/assessments/items,
 * feed prefs and audit logs.
 */
const { PrismaClient } = require("@prisma/client");
const { hashSync } = require("bcryptjs");

const prisma = new PrismaClient();

function hash(raw) {
  return hashSync(raw, 12);
}

async function main() {
  const { SEED_PASSWORD } = require("../config/env").env;

  const admin = await prisma.users.create({
    data: { email: "admin@adaptivelearning.com", password_hash: hash(SEED_PASSWORD), role: "ADMIN" },
  });
  const tutor = await prisma.users.create({
    data: { email: "tutor@adaptivelearning.com", password_hash: hash(SEED_PASSWORD), role: "TUTOR" },
  });
  const parent = await prisma.users.create({
    data: { email: "parent@adaptivelearning.com", password_hash: hash(SEED_PASSWORD), role: "PARENT" },
  });
  const student = await prisma.users.create({
    data: { email: "student@adaptivelearning.com", password_hash: hash(SEED_PASSWORD), role: "STUDENT" },
  });

  await prisma.parent_student_map.create({
    data: { parent_id: parent.id, student_id: student.id },
  });

  const klass = await prisma.classes.create({
    data: { name: "Calculus I", code: "CAL-101", is_published: true },
  });
  await prisma.class_arms.create({
    data: { class_id: klass.id, arm_name: "Evenings", assigned_tutor_id: tutor.id },
  });
  await prisma.class_enrollments.create({ data: { class_id: klass.id, user_id: student.id } });

  const course = await prisma.courses.create({
    data: { title: "Calculus I", slug: "calculus-i", level: "Intermediate", is_published: true },
  });
  const module = await prisma.modules.create({
    data: { course_id: course.id, title: "Foundations", order: 0 },
  });
  const lesson = await prisma.lessons.create({
    data: { module_id: module.id, title: "Limits and Continuity", order: 0, duration_seconds: 1200 },
  });
  const assessment = await prisma.assessments.create({
    data: { lesson_id: lesson.id, type: "quiz", config: { numQuestions: 5, adaptive: true } },
  });
  await prisma.items.createMany({
    data: [
      {
        assessment_id: assessment.id,
        question: "What does 'limit as x approaches a of f(x) = L' mean?",
        options: ["∀ε∃δ…", "∀δ∃ε…", "It exists only when f is continuous."],
        correct_answer: ["∀ε∃δ…"],
        points: 3,
        difficulty: 2,
        explanation: "The ε-δ definition.",
      },
      {
        assessment_id: assessment.id,
        question: "If f(x) → 1 as x → 0 from both sides, is the limit defined?",
        options: ["Only for x > 0", "Yes — both-sided limits are defined", "Only from the right"],
        correct_answer: ["Yes — both-sided limits are defined"],
        points: 3,
        difficulty: 1,
        explanation: "Two-sided limits require the same value from both sides.",
      },
    ],
  });

  await prisma.social_feed_prefs.create({
    data: { user_id: student.id, topics: ["math", "education"], muted_sources: [] },
  });

  await prisma.audit_logs.createMany({
    data: [
      { action: "user.create", entity: "user", entity_id: admin.id, user_email: admin.email },
      { action: "user.create", entity: "user", entity_id: tutor.id, user_email: tutor.email },
      { action: "user.create", entity: "user", entity_id: student.id, user_email: student.email },
      { action: "class.create", entity: "class", entity_id: klass.id, user_email: admin.email },
    ],
  });

  console.log(`Seed complete. Accounts: ${admin.email}, ${tutor.email}, ${parent.email} (${student.email}).`);
}

main()
  .then(() => prisma.$disconnect().catch(() => {}))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
