/**
 * Seeds sample quizzes/activities for a school.
 * Called when a school_admin is first created for a school,
 * and by `npm run seed` for the system-admin school.
 */
const Quiz = require("../models/Quiz");
const Note = require("../models/Note");
const fs = require("fs");
const path = require("path");

// Sample quiz content per subject (plain-text questions)
const SAMPLE_QUIZZES = [
  {
    subject: "Mathematics",
    topic: "Algebra",
    title: "Algebra Practice Quiz",
    description: "Basic algebra questions to test your understanding.",
    content: `1. Solve for x: 2x + 5 = 15
2. Simplify: 3(x + 4) - 2(x - 1)
3. If y = 3x - 7, find y when x = 4
4. Solve: x/3 + 2 = 5
5. Expand: (x + 3)(x - 2)`,
  },
  {
    subject: "English",
    topic: "Comprehension",
    title: "Reading Comprehension Exercise",
    description: "Practice your reading and understanding skills.",
    content: `Read the passage below and answer the questions:

"Education is the most powerful weapon which you can use to change the world." — Nelson Mandela

1. Who said this quote?
2. What does the author compare education to?
3. In your own words, explain what this quote means.
4. Do you agree with this statement? Give two reasons.
5. Write a short paragraph about the importance of education.`,
  },
  {
    subject: "Physics",
    topic: "Forces and Motion",
    title: "Forces and Motion Quiz",
    description: "Test your knowledge of Newton's Laws and basic mechanics.",
    content: `1. State Newton's First Law of Motion.
2. A car of mass 1000 kg accelerates at 2 m/s². Calculate the force applied.
3. What is the SI unit of force?
4. Differentiate between mass and weight.
5. A body moves with uniform velocity. What is its acceleration?`,
  },
  {
    subject: "Chemistry",
    topic: "Atomic Structure",
    title: "Atomic Structure Quiz",
    description: "Questions on atoms, elements, and the periodic table.",
    content: `1. Define an atom.
2. Name the three subatomic particles and their charges.
3. What is the atomic number of Carbon?
4. How many electrons can the first electron shell hold?
5. What is an isotope? Give one example.`,
  },
  {
    subject: "Biology",
    topic: "Cell Biology",
    title: "Cell Structure and Function Quiz",
    description: "Explore the building blocks of life.",
    content: `1. What is a cell?
2. Name three organelles found in both plant and animal cells.
3. What is the function of the mitochondria?
4. Differentiate between a plant cell and an animal cell.
5. What is the role of the cell membrane?`,
  },
  {
    subject: "History",
    topic: "East African History",
    title: "Pre-Colonial East Africa Quiz",
    description: "Learn about the history of East Africa before colonialism.",
    content: `1. Name two pre-colonial kingdoms in Uganda.
2. Who was the leader of the Buganda Kingdom in the 19th century?
3. What was the main economic activity of pre-colonial societies in East Africa?
4. Describe the social organization of the Acholi people.
5. What role did trade play in the development of East African kingdoms?`,
  },
];

/**
 * Seed sample quizzes for a given school.
 * Skips if quizzes already exist for the school.
 *
 * @param {string} schoolId - UUID of the school
 * @param {string} uploadedById - UUID of the admin user creating them
 * @param {object} [transaction] - Optional Sequelize transaction
 */
async function seedSampleQuizzes(schoolId, uploadedById, transaction) {
  try {
    // Skip if school already has quizzes
    const existing = await Quiz.count({
      where: { schoolId },
      ...(transaction ? { transaction } : {}),
    });

    if (existing > 0) {
      console.log(
        `⏭️  School ${schoolId} already has ${existing} quizzes, skipping sample seed.`,
      );
      return;
    }

    const quizzesToCreate = [];
    const classes = ["s1", "s2", "s3", "s4"];

    for (const sample of SAMPLE_QUIZZES) {
      for (const cls of classes) {
        quizzesToCreate.push({
          title: `${sample.title} — ${cls.toUpperCase()}`,
          description: sample.description,
          subject: sample.subject,
          topic: sample.topic,
          class: cls,
          level: "o-level",
          type: "plain",
          content: sample.content,
          uploadedById,
          schoolId,
          isActive: true,
        });
      }
    }

    await Quiz.bulkCreate(quizzesToCreate, transaction ? { transaction } : {});
    console.log(
      `✅ Seeded ${quizzesToCreate.length} sample quizzes for school ${schoolId}.`,
    );
  } catch (error) {
    console.error("❌ Failed to seed sample quizzes:", error.message);
  }
}

async function seedSampleNotes(schoolId, uploadedById, transaction) {
  try {
    const existing = await Note.count({
      where: { schoolId },
      ...(transaction ? { transaction } : {}),
    });

    if (existing > 0) {
      console.log(
        `⏭️  School ${schoolId} already has ${existing} notes, skipping sample seed.`,
      );
      return;
    }

    const uploadsDir = path.join(__dirname, "..", "..", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const notesToCreate = [];
    const classes = ["s1", "s2", "s3", "s4"];

    for (const sample of SAMPLE_QUIZZES) {
      for (const cls of classes) {
        // Create a real dummy file in uploads so it can be downloaded
        const fileName = `sample_note_${sample.subject}_${cls}_${Date.now()}.txt`;
        const filePath = path.join(uploadsDir, fileName);
        const fileContent = `This is a sample document for ${sample.subject} - ${cls}.\n\nIt was automatically generated for this school.\n\nDescription: ${sample.description}`;
        fs.writeFileSync(filePath, fileContent);

        notesToCreate.push({
          title: `Study Guide: ${sample.subject} - ${cls.toUpperCase()}`,
          description: `A sample document about ${sample.topic}`,
          subject: sample.subject,
          class: cls,
          level: "o-level",
          fileName,
          originalFileName: `Study_Guide_${sample.subject}.txt`,
          filePath: `uploads/${fileName}`,
          fileSize: fs.statSync(filePath).size,
          fileType: "text/plain",
          uploadedById,
          schoolId,
          isActive: true,
        });
      }
    }

    await Note.bulkCreate(notesToCreate, transaction ? { transaction } : {});
    console.log(
      `✅ Seeded ${notesToCreate.length} sample notes and files for school ${schoolId}.`,
    );
  } catch (error) {
    console.error("❌ Failed to seed sample notes:", error.message);
  }
}

module.exports = { seedSampleQuizzes, seedSampleNotes };
