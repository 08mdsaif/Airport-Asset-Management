require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Department = require('../models/Department');
const Asset = require('../models/Asset');
const { generateSequentialId } = require('./idGenerator');

const seed = async () => {
  await connectDB();
  console.log('🌱 Seeding database...');

  await Promise.all([User.deleteMany(), Department.deleteMany(), Asset.deleteMany()]);

  const departments = await Department.insertMany([
    { name: 'Terminal Operations', code: 'TERM', description: 'Passenger terminal facilities', location: 'Terminal 1-3' },
    { name: 'Air Traffic Control', code: 'ATC', description: 'Air traffic control systems', location: 'ATC Tower' },
    { name: 'Ground Support Equipment', code: 'GSE', description: 'Ground handling equipment', location: 'Airside' },
    { name: 'Electrical & HVAC', code: 'ELEC', description: 'Power, lighting & climate systems', location: 'Utility Building' },
    { name: 'Fire & Safety', code: 'FIRE', description: 'Fire safety and emergency systems', location: 'All Terminals' },
    { name: 'IT & Networking', code: 'IT', description: 'Network, servers and IT infrastructure', location: 'Data Center' },
  ]);

  const admin = await User.create({
    name: 'System Administrator',
    email: 'admin@aai.gov.in',
    password: 'Admin@123',
    role: 'admin',
    department: departments[0]._id,
    designation: 'System Administrator',
  });

  const supervisor = await User.create({
    name: 'Ramesh Kumar',
    email: 'supervisor@aai.gov.in',
    password: 'Supervisor@123',
    role: 'supervisor',
    department: departments[3]._id,
    designation: 'Maintenance Supervisor',
  });
  
  const supervisor2 = await User.create({
    name: 'Anjali Desai',
    email: 'supervisor2@aai.gov.in',
    password: 'Supervisor@123',
    role: 'supervisor',
    department: departments[1]._id,
    designation: 'ATC Operations Supervisor',
  });

  const employee = await User.create({
    name: 'Priya Sharma',
    email: 'employee@aai.gov.in',
    password: 'Employee@123',
    role: 'employee',
    department: departments[0]._id,
    designation: 'Terminal Technician',
  });
  
  const employee2 = await User.create({
    name: 'Vikram Singh',
    email: 'employee2@aai.gov.in',
    password: 'Employee@123',
    role: 'employee',
    department: departments[2]._id,
    designation: 'GSE Operator',
  });
  
  const employee3 = await User.create({
    name: 'Neha Gupta',
    email: 'employee3@aai.gov.in',
    password: 'Employee@123',
    role: 'employee',
    department: departments[5]._id,
    designation: 'IT Support Specialist',
  });

  const sampleAssets = [
    { name: 'Baggage Carousel B4', category: 'Baggage Handling', department: departments[0]._id, location: 'Terminal 2, Arrivals', criticality: 'high', utilization: 78 },
    { name: 'Escalator E-12', category: 'Escalator/Elevator', department: departments[0]._id, location: 'Terminal 1, Level 2', criticality: 'medium', utilization: 65 },
    { name: 'ATC Radar Unit R1', category: 'IT/Networking', department: departments[1]._id, location: 'ATC Tower', criticality: 'critical', utilization: 92 },
    { name: 'Pushback Tug PT-07', category: 'Ground Support Equipment', department: departments[2]._id, location: 'Apron Bay 3', criticality: 'high', utilization: 55 },
    { name: 'HVAC Chiller Unit C2', category: 'HVAC', department: departments[3]._id, location: 'Utility Building', criticality: 'medium', utilization: 70 },
    { name: 'Fire Suppression Panel FS-01', category: 'Fire Safety', department: departments[4]._id, location: 'Terminal 3', criticality: 'critical', utilization: 40 },
    { name: 'Security Scanner S-05', category: 'Other', department: departments[0]._id, location: 'Terminal 1, Gate 5', criticality: 'critical', utilization: 85 },
    { name: 'Runway Lighting System L-Main', category: 'Electrical', department: departments[3]._id, location: 'Main Runway', criticality: 'critical', utilization: 98 },
    { name: 'Passenger Boarding Bridge PB-12', category: 'Ground Support Equipment', department: departments[2]._id, location: 'Terminal 2, Gate 12', criticality: 'high', utilization: 60 },
    { name: 'CCTV Camera Network Node-3', category: 'IT/Networking', department: departments[5]._id, location: 'Terminal 3, Concourse B', criticality: 'medium', utilization: 95 },
    { name: 'Baggage Tractor BT-02', category: 'Ground Support Equipment', department: departments[2]._id, location: 'Airside', criticality: 'medium', utilization: 50 },
    { name: 'Backup Generator BG-1', category: 'Electrical', department: departments[3]._id, location: 'Utility Building', criticality: 'critical', utilization: 10 },
    { name: 'Fire Engine FE-04', category: 'Fire Safety', department: departments[4]._id, location: 'Fire Station 1', criticality: 'critical', utilization: 5 },
    { name: 'Flight Information Display Board F-10', category: 'IT/Networking', department: departments[5]._id, location: 'Terminal 1, Departures', criticality: 'medium', utilization: 90 },
    { name: 'PA System Amplifier', category: 'IT/Networking', department: departments[5]._id, location: 'Terminal 2', criticality: 'low', utilization: 25 },
    { name: 'Water Pump Station W-1', category: 'HVAC', department: departments[3]._id, location: 'Utility Building', criticality: 'medium', utilization: 45 },
    { name: 'X-Ray Machine X-02', category: 'Other', department: departments[0]._id, location: 'Terminal 2, Security Check', criticality: 'critical', utilization: 75 },
    { name: 'Ambulance AMB-1', category: 'Fire Safety', department: departments[4]._id, location: 'Medical Center', criticality: 'high', utilization: 15 },
    { name: 'Communication Tower CT-1', category: 'IT/Networking', department: departments[1]._id, location: 'Airside South', criticality: 'critical', utilization: 100 },
    { name: 'Elevator L-4', category: 'Escalator/Elevator', department: departments[0]._id, location: 'Terminal 3, Level 1 to 3', criticality: 'medium', utilization: 80 }
  ];

  for (const a of sampleAssets) {
    const assetId = await generateSequentialId(Asset, 'assetId', 'AST');
    await Asset.create({ ...a, assetId, createdBy: admin._id });
  }

  console.log('✅ Seed complete!');
  console.log('----------------------------------------');
  console.log('Admin login:      admin@aai.gov.in / Admin@123');
  console.log('Supervisor login: supervisor@aai.gov.in / Supervisor@123');
  console.log('Employee login:   employee@aai.gov.in / Employee@123');
  console.log('----------------------------------------');

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

// require('dotenv').config();
// const mongoose = require('mongoose');
// const connectDB = require('../config/db');
// const User = require('../models/User');
// const Department = require('../models/Department');
// const Asset = require('../models/Asset');
// const { generateSequentialId } = require('./idGenerator');

// const seed = async () => {
//   await connectDB();
//   console.log('🌱 Seeding database...');

//   await Promise.all([User.deleteMany(), Department.deleteMany(), Asset.deleteMany()]);

//   const departments = await Department.insertMany([
//     { name: 'Terminal Operations', code: 'TERM', description: 'Passenger terminal facilities', location: 'Terminal 1-3' },
//     { name: 'Air Traffic Control', code: 'ATC', description: 'Air traffic control systems', location: 'ATC Tower' },
//     { name: 'Ground Support Equipment', code: 'GSE', description: 'Ground handling equipment', location: 'Airside' },
//     { name: 'Electrical & HVAC', code: 'ELEC', description: 'Power, lighting & climate systems', location: 'Utility Building' },
//     { name: 'Fire & Safety', code: 'FIRE', description: 'Fire safety and emergency systems', location: 'All Terminals' },
//     { name: 'IT & Networking', code: 'IT', description: 'Network, servers and IT infrastructure', location: 'Data Center' },
//   ]);

//   const admin = await User.create({
//     name: 'System Administrator',
//     email: 'admin@aai.gov.in',
//     password: 'Admin@123',
//     role: 'admin',
//     department: departments[0]._id,
//     designation: 'System Administrator',
//   });

//   const supervisor = await User.create({
//     name: 'Ramesh Kumar',
//     email: 'supervisor@aai.gov.in',
//     password: 'Supervisor@123',
//     role: 'supervisor',
//     department: departments[3]._id,
//     designation: 'Maintenance Supervisor',
//   });

//   const employee = await User.create({
//     name: 'Priya Sharma',
//     email: 'employee@aai.gov.in',
//     password: 'Employee@123',
//     role: 'employee',
//     department: departments[0]._id,
//     designation: 'Terminal Technician',
//   });

//   const sampleAssets = [
//     { name: 'Baggage Carousel B4', category: 'Baggage Handling', department: departments[0]._id, location: 'Terminal 2, Arrivals', criticality: 'high', utilization: 78 },
//     { name: 'Escalator E-12', category: 'Escalator/Elevator', department: departments[0]._id, location: 'Terminal 1, Level 2', criticality: 'medium', utilization: 65 },
//     { name: 'ATC Radar Unit R1', category: 'IT/Networking', department: departments[1]._id, location: 'ATC Tower', criticality: 'critical', utilization: 92 },
//     { name: 'Pushback Tug PT-07', category: 'Ground Support Equipment', department: departments[2]._id, location: 'Apron Bay 3', criticality: 'high', utilization: 55 },
//     { name: 'HVAC Chiller Unit C2', category: 'HVAC', department: departments[3]._id, location: 'Utility Building', criticality: 'medium', utilization: 70 },
//     { name: 'Fire Suppression Panel FS-01', category: 'Fire Safety', department: departments[4]._id, location: 'Terminal 3', criticality: 'critical', utilization: 40 },
//   ];

//   for (const a of sampleAssets) {
//     const assetId = await generateSequentialId(Asset, 'assetId', 'AST');
//     await Asset.create({ ...a, assetId, createdBy: admin._id });
//   }

//   console.log('✅ Seed complete!');
//   console.log('----------------------------------------');
//   console.log('Admin login:      admin@aai.gov.in / Admin@123');
//   console.log('Supervisor login: supervisor@aai.gov.in / Supervisor@123');
//   console.log('Employee login:   employee@aai.gov.in / Employee@123');
//   console.log('----------------------------------------');

//   await mongoose.connection.close();
//   process.exit(0);
// };

// seed().catch((err) => {
//   console.error(err);
//   process.exit(1);
// });
