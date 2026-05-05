/**
 * Define all relationships here in a single place to avoid circular dependencies
 * We use the model registry instead of direct requires to be safe.
 */
function setupAssociations(sequelize) {
  const {
    User,
    School,
    Note,
    Quiz,
    Subject,
    ClassStream,
    Resource,
    Discussion,
  } = sequelize.models;

  // User - School
  if (User && School) {
    User.belongsTo(School, { foreignKey: "schoolId", as: "school" });
    School.hasMany(User, { foreignKey: "schoolId", as: "users" });
  }

  // Note - User (uploadedBy)
  if (Note && User) {
    Note.belongsTo(User, { foreignKey: "uploadedById", as: "uploadedBy" });
    User.hasMany(Note, { foreignKey: "uploadedById", as: "notes" });
  }

  // Note - School
  if (Note && School) {
    Note.belongsTo(School, { foreignKey: "schoolId", as: "school" });
    School.hasMany(Note, { foreignKey: "schoolId", as: "notes" });
  }

  // Quiz - School
  if (Quiz && School) {
    Quiz.belongsTo(School, { foreignKey: "schoolId", as: "school" });
    School.hasMany(Quiz, { foreignKey: "schoolId", as: "quizzes" });
  }

  // Quiz - User (uploadedBy)
  if (Quiz && User) {
    Quiz.belongsTo(User, { foreignKey: "uploadedById", as: "uploadedBy" });
    User.hasMany(Quiz, { foreignKey: "uploadedById", as: "quizzes" });
  }

  // Resource - User (addedBy)
  if (Resource && User) {
    Resource.belongsTo(User, { foreignKey: "addedById", as: "addedBy" });
    User.hasMany(Resource, { foreignKey: "addedById", as: "resources" });
  }

  // Subject - School
  if (Subject && School) {
    Subject.belongsTo(School, { foreignKey: "schoolId", as: "school" });
    School.hasMany(Subject, { foreignKey: "schoolId", as: "subjects" });
  }

  // ClassStream - School
  if (ClassStream && School) {
    ClassStream.belongsTo(School, { foreignKey: "schoolId", as: "school" });
    School.hasMany(ClassStream, { foreignKey: "schoolId", as: "streams" });
  }

  // Discussion - Subject
  if (Discussion && Subject) {
    Discussion.belongsTo(Subject, { foreignKey: "subjectId", as: "subject" });
    Subject.hasMany(Discussion, { foreignKey: "subjectId", as: "discussions" });
  }

  // Discussion - User (createdBy)
  if (Discussion && User) {
    Discussion.belongsTo(User, { foreignKey: "createdById", as: "createdBy" });
    User.hasMany(Discussion, { foreignKey: "createdById", as: "discussions" });
  }

  console.log("🛠️ Database associations initialized.");
}

module.exports = { setupAssociations };
