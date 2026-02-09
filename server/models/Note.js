const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const Note = sequelize.define('Note', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please provide a title' }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please provide a subject' }
    }
  },
  class: {
    type: DataTypes.ENUM('s1', 's2', 's3', 's4', 's5', 's6'),
    allowNull: false
  },
  level: {
    type: DataTypes.ENUM('o-level', 'a-level'),
    allowNull: false
  },
  combination: {
    type: DataTypes.ENUM('PCM', 'PCB', 'BCG', 'HEG', 'HEL', 'MEG', 'DEG', 'MPG', 'BCM', 'HGL', 'AKR'),
    allowNull: true
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  originalFileName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  fileType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  downloads: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  uploadedById: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'notes',
  timestamps: true,
  indexes: [
    { fields: ['title'] },
    { fields: ['subject'] },
    { fields: ['class'] },
    { fields: ['level'] },
    { fields: ['subject', 'class', 'level'] },
    { fields: ['createdAt'] }
  ]
});

Note.belongsTo(User, { foreignKey: 'uploadedById', as: 'uploadedBy' });

Note.prototype.incrementDownloads = async function() {
  this.downloads += 1;
  await this.save();
  return this;
};

Note.prototype.incrementViews = async function() {
  this.views += 1;
  await this.save();
  return this;
};

Note.prototype.getReadableFileSize = function() {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

Note.searchNotes = async function(searchTerm, filters = {}) {
  const where = { isActive: true };
  
  if (searchTerm) {
    where[sequelize.Sequelize.Op.or] = [
      { title: { [sequelize.Sequelize.Op.iLike]: `%${searchTerm}%` } },
      { description: { [sequelize.Sequelize.Op.iLike]: `%${searchTerm}%` } }
    ];
  }
  
  if (filters.level) where.level = filters.level;
  if (filters.class) where.class = filters.class;
  if (filters.subject) where.subject = filters.subject;
  if (filters.combination) where.combination = filters.combination;
  
  return await this.findAll({
    where,
    include: [{ model: User, as: 'uploadedBy', attributes: ['id', 'name', 'email'] }],
    order: [['createdAt', 'DESC']]
  });
};

Note.getRecentNotes = async function(limit = 10) {
  return await this.findAll({
    where: { isActive: true },
    include: [{ model: User, as: 'uploadedBy', attributes: ['id', 'name', 'email'] }],
    order: [['createdAt', 'DESC']],
    limit
  });
};

Note.getPopularNotes = async function(limit = 10) {
  return await this.findAll({
    where: { isActive: true },
    include: [{ model: User, as: 'uploadedBy', attributes: ['id', 'name', 'email'] }],
    order: [['downloads', 'DESC']],
    limit
  });
};

module.exports = Note;