// Mock for localData
const mockFindById = jest.fn();
const mockFindAll = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockInactivate = jest.fn();

module.exports = {
  findById: mockFindById,
  findAll: mockFindAll,
  create: mockCreate,
  update: mockUpdate,
  inactivate: mockInactivate,
};