require('dotenv').config({ path: __dirname + '/../../.env' });
const mongoose = require('mongoose');
const { connectDB, closeDB } = require('../config/db');

const User = require('../models/User');
const Student = require('../models/Student');
const Presenter = require('../models/Presenter');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Schedule = require('../models/Schedule');
const Result = require('../models/Result');
const Notification = require('../models/Notification');

const seedData = async () => {
  try {
    await connectDB();
    console.log('[Seed] Connected to database. Clearing old data...');

    // Clear existing collections
    await User.deleteMany({});
    await Student.deleteMany({});
    await Presenter.deleteMany({});
    await Event.deleteMany({});
    await Registration.deleteMany({});
    await Schedule.deleteMany({});
    await Result.deleteMany({});
    await Notification.deleteMany({});

    console.log('[Seed] Database cleared. Seeding Users...');

    // 1. Create Admin User
    const admin = await User.create({
      name: 'Campus Administrator',
      email: 'admin@college.edu',
      password: 'adminpassword123',
      role: 'admin'
    });

    // 2. Create Presenters
    const presenterUser1 = await User.create({
      name: 'Dr. Sarah Jenkins',
      email: 'dr.sarah@college.edu',
      password: 'presenter123',
      role: 'presenter'
    });
    const presenter1 = await Presenter.create({
      user: presenterUser1._id,
      designation: 'Professor & Head of AI Research',
      department: 'Computer Science & Engineering',
      contact: '+1 (555) 234-5678',
      bio: 'Leading researcher in Artificial Intelligence, Deep Learning, and Distributed Cloud Computing with over 15 years of industry and academic mentorship.',
      specialization: 'Artificial Intelligence & Cloud'
    });

    const presenterUser2 = await User.create({
      name: 'Prof. Rahul Sharma',
      email: 'prof.rahul@college.edu',
      password: 'presenter123',
      role: 'presenter'
    });
    const presenter2 = await Presenter.create({
      user: presenterUser2._id,
      designation: 'Associate Professor & Robotics Coordinator',
      department: 'Electronics & Communication',
      contact: '+1 (555) 876-5432',
      bio: 'Pioneer in Autonomous Systems, IoT, and Embedded Microcontrollers. Head of University Robotics Lab.',
      specialization: 'Robotics, IoT & Embedded Systems'
    });

    const presenterUser3 = await User.create({
      name: 'Priya Nair',
      email: 'priya.nair@college.edu',
      password: 'presenter123',
      role: 'presenter'
    });
    const presenter3 = await Presenter.create({
      user: presenterUser3._id,
      designation: 'Staff Product Designer & UX Consultant',
      department: 'Design & Innovation Hub',
      contact: '+1 (555) 432-1098',
      bio: 'Senior UX Lead focused on Human-Computer Interaction, Design Systems, and accessible design in high-scale web applications.',
      specialization: 'UI/UX Design & HCI'
    });

    console.log('[Seed] Seeding Students...');

    // 3. Create Students
    const studentUser1 = await User.create({
      name: 'Alex Morgan',
      email: 'alex.morgan@college.edu',
      password: 'student123',
      role: 'student'
    });
    const student1 = await Student.create({
      user: studentUser1._id,
      studentId: 'CS2024-089',
      department: 'Computer Science & Engineering',
      year: '3rd Year',
      phone: '+1 (555) 912-3456'
    });

    const studentUser2 = await User.create({
      name: 'Riya Patel',
      email: 'riya.patel@college.edu',
      password: 'student123',
      role: 'student'
    });
    const student2 = await Student.create({
      user: studentUser2._id,
      studentId: 'IT2024-042',
      department: 'Information Technology',
      year: '2nd Year',
      phone: '+1 (555) 823-4567'
    });

    const studentUser3 = await User.create({
      name: 'David Kumar',
      email: 'david.kumar@college.edu',
      password: 'student123',
      role: 'student'
    });
    const student3 = await Student.create({
      user: studentUser3._id,
      studentId: 'EC2024-015',
      department: 'Electronics & Communication',
      year: '4th Year',
      phone: '+1 (555) 734-5678'
    });

    const studentUser4 = await User.create({
      name: 'Ananya Sen',
      email: 'ananya.sen@college.edu',
      password: 'student123',
      role: 'student'
    });
    const student4 = await Student.create({
      user: studentUser4._id,
      studentId: 'CS2024-112',
      department: 'Computer Science & Engineering',
      year: '1st Year',
      phone: '+1 (555) 645-6789'
    });

    console.log('[Seed] Seeding Events...');

    // 4. Create Events
    const now = new Date();
    
    // Upcoming Event 1: Paid Flagship Hackathon
    const date1 = new Date(now);
    date1.setDate(date1.getDate() + 5);

    const event1 = await Event.create({
      title: 'National College Hackathon: CodeSprint AI 2026',
      description: 'A 24-hour flagship collegiate hackathon bringing together students to solve real-world problems using Artificial Intelligence, Web3, and Full-Stack Cloud computing. Mentorship provided by top industry engineers.',
      category: 'Hackathon',
      venue: 'Main Campus Tech Complex & Grand Hall',
      eventDate: date1,
      startTime: '09:00 AM',
      endTime: '05:00 PM',
      capacity: 120,
      presenter: presenter1._id,
      status: 'upcoming',
      image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=60',
      registrationFee: 499,
      isPaid: true,
      upiId: 'RANGA SIRIHASINI',
      upiHandle: 'ranga.sirihasini@phonepe',
      paymentQrImage: '/img/payment-qr.jpg'
    });

    // Upcoming Event 2: Free Hackathon
    const dateFreeHack = new Date(now);
    dateFreeHack.setDate(dateFreeHack.getDate() + 7);

    const eventFreeHack = await Event.create({
      title: 'Open-Source Campus Hack & Build Sprint',
      description: 'A community-driven, 100% free collaborative hackathon for beginners and open-source contributors. Build projects, fix issues, and win swag bags!',
      category: 'Hackathon',
      venue: 'Computing Lab Block 2 & Innovation Hall',
      eventDate: dateFreeHack,
      startTime: '10:00 AM',
      endTime: '04:00 PM',
      capacity: 100,
      presenter: presenter2._id,
      status: 'upcoming',
      image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60',
      registrationFee: 0,
      isPaid: false
    });

    // Upcoming Event 3: Paid Masterclass Workshop
    const date2 = new Date(now);
    date2.setDate(date2.getDate() + 10);

    const event2 = await Event.create({
      title: 'Full-Stack Cloud & Microservices Masterclass',
      description: 'Hands-on architectural workshop covering modern Node.js backend development, MongoDB scalability, containerization, and RESTful API deployment.',
      category: 'Workshop',
      venue: 'Computing Lab Block 4, Room 302',
      eventDate: date2,
      startTime: '10:00 AM',
      endTime: '03:30 PM',
      capacity: 60,
      presenter: presenter1._id,
      status: 'upcoming',
      image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=60',
      registrationFee: 299,
      isPaid: true,
      upiId: 'RANGA SIRIHASINI',
      upiHandle: 'ranga.sirihasini@phonepe',
      paymentQrImage: '/img/payment-qr.jpg'
    });

    // Upcoming Event 4: Free Workshop
    const dateFreeWork = new Date(now);
    dateFreeWork.setDate(dateFreeWork.getDate() + 12);

    const eventFreeWork = await Event.create({
      title: 'Git, GitHub & Web Development Essentials Workshop',
      description: 'Free beginner-friendly workshop introducing version control with Git, collaborative pull requests, branching workflows, and hosting web applications.',
      category: 'Workshop',
      venue: 'Seminar Hall 1 & Online Stream',
      eventDate: dateFreeWork,
      startTime: '02:00 PM',
      endTime: '05:00 PM',
      capacity: 150,
      presenter: presenter3._id,
      status: 'upcoming',
      image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=60',
      registrationFee: 0,
      isPaid: false
    });

    // Upcoming Event 5: Paid Robotics Challenge
    const date3 = new Date(now);
    date3.setDate(date3.getDate() + 14);

    const event3 = await Event.create({
      title: 'Annual Autonomous Robotics & Drone Expo',
      description: 'Live demonstrations, line follower race, maze solver challenges, and aerial obstacle navigation. Compete for cash prizes and certification.',
      category: 'Technical',
      venue: 'Engineering Courtyard & Indoor Sports Arena',
      eventDate: date3,
      startTime: '11:00 AM',
      endTime: '06:00 PM',
      capacity: 80,
      presenter: presenter2._id,
      status: 'upcoming',
      image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=60',
      registrationFee: 199,
      isPaid: true,
      upiId: 'RANGA SIRIHASINI',
      upiHandle: 'ranga.sirihasini@phonepe',
      paymentQrImage: '/img/payment-qr.jpg'
    });

    // Completed Event 6: UI/UX Masterclass (with completed results)
    const date4 = new Date(now);
    date4.setDate(date4.getDate() - 7);

    const event4 = await Event.create({
      title: 'Design Systems & Modern UI/UX Sprint',
      description: 'Interactive sprint on Figma design workflows, wireframing, color psychology, and building seamless responsive user interfaces for modern web applications.',
      category: 'Workshop',
      venue: 'Design Studio & Auditorium B',
      eventDate: date4,
      startTime: '01:00 PM',
      endTime: '05:30 PM',
      capacity: 50,
      presenter: presenter3._id,
      status: 'completed',
      image: 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=800&auto=format&fit=crop&q=60',
      registrationFee: 249,
      isPaid: true,
      upiId: 'RANGA SIRIHASINI',
      upiHandle: 'ranga.sirihasini@phonepe',
      paymentQrImage: '/img/payment-qr.jpg'
    });

    // Completed Event 7: Cultural Fest (Free Event)
    const date5 = new Date(now);
    date5.setDate(date5.getDate() - 14);

    const event5 = await Event.create({
      title: 'Kalakriti 2026: Annual Inter-College Cultural Gala',
      description: 'A vibrant celebration of music, dance, theatrical drama, and fine arts celebrating student talents across universities.',
      category: 'Cultural',
      venue: 'Open Air Amphitheatre',
      eventDate: date5,
      startTime: '04:00 PM',
      endTime: '10:00 PM',
      capacity: 250,
      presenter: presenter3._id,
      status: 'completed',
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=60',
      registrationFee: 0,
      isPaid: false
    });

    console.log('[Seed] Seeding Schedules...');

    // 5. Create Schedules for Event 1 (Hackathon)
    await Schedule.insertMany([
      {
        event: event1._id,
        activityName: 'Check-in, Registration & Welcome Breakfast',
        scheduleDate: date1,
        startTime: '09:00 AM',
        endTime: '10:00 AM',
        venue: 'Grand Hall Lobby',
        speakerOrLead: 'Admin & Student Committee'
      },
      {
        event: event1._id,
        activityName: 'Keynote & Problem Statement Release',
        scheduleDate: date1,
        startTime: '10:00 AM',
        endTime: '11:00 AM',
        venue: 'Auditorium 1',
        speakerOrLead: 'Dr. Sarah Jenkins'
      },
      {
        event: event1._id,
        activityName: 'Hacking Begins: Architecture & Prototyping',
        scheduleDate: date1,
        startTime: '11:00 AM',
        endTime: '01:30 PM',
        venue: 'Tech Complex Lab 1-4',
        speakerOrLead: 'Technical Mentors'
      },
      {
        event: event1._id,
        activityName: 'Mid-Evaluation & Mentorship Check-in',
        scheduleDate: date1,
        startTime: '02:30 PM',
        endTime: '03:30 PM',
        venue: 'Tech Complex',
        speakerOrLead: 'Jury Panel'
      },
      {
        event: event1._id,
        activityName: 'Final Pitch Presentations & Winner Announcement',
        scheduleDate: date1,
        startTime: '04:00 PM',
        endTime: '05:00 PM',
        venue: 'Auditorium 1',
        speakerOrLead: 'Faculty & Industry Judges'
      }
    ]);

    // Schedules for Event 4 (UI/UX)
    await Schedule.insertMany([
      {
        event: event4._id,
        activityName: 'Fundamentals of Design Systems & Wireframing',
        scheduleDate: date4,
        startTime: '01:00 PM',
        endTime: '02:30 PM',
        venue: 'Design Studio',
        speakerOrLead: 'Priya Nair'
      },
      {
        event: event4._id,
        activityName: 'Live Design Challenge & Critique Session',
        scheduleDate: date4,
        startTime: '03:00 PM',
        endTime: '04:45 PM',
        venue: 'Design Studio Lab',
        speakerOrLead: 'Priya Nair'
      },
      {
        event: event4._id,
        activityName: 'Awards & Certificate Distribution',
        scheduleDate: date4,
        startTime: '05:00 PM',
        endTime: '05:30 PM',
        venue: 'Auditorium B',
        speakerOrLead: 'Priya Nair'
      }
    ]);

    console.log('[Seed] Seeding Registrations...');

    // 6. Create Registrations
    await Registration.insertMany([
      {
        event: event1._id,
        student: student1._id,
        registrationDate: new Date(),
        registrationStatus: 'registered',
        qrCodeToken: 'REG-AI-9021'
      },
      {
        event: event1._id,
        student: student2._id,
        registrationDate: new Date(),
        registrationStatus: 'registered',
        qrCodeToken: 'REG-AI-9022'
      },
      {
        event: event1._id,
        student: student3._id,
        registrationDate: new Date(),
        registrationStatus: 'registered',
        qrCodeToken: 'REG-AI-9023'
      },
      {
        event: event2._id,
        student: student1._id,
        registrationDate: new Date(),
        registrationStatus: 'registered',
        qrCodeToken: 'REG-CW-5101'
      },
      {
        event: event2._id,
        student: student4._id,
        registrationDate: new Date(),
        registrationStatus: 'registered',
        qrCodeToken: 'REG-CW-5102'
      },
      {
        event: event4._id,
        student: student1._id,
        registrationDate: new Date(date4),
        registrationStatus: 'attended',
        attended: true,
        qrCodeToken: 'REG-UX-3011'
      },
      {
        event: event4._id,
        student: student2._id,
        registrationDate: new Date(date4),
        registrationStatus: 'attended',
        attended: true,
        qrCodeToken: 'REG-UX-3012'
      },
      {
        event: event4._id,
        student: student3._id,
        registrationDate: new Date(date4),
        registrationStatus: 'attended',
        attended: true,
        qrCodeToken: 'REG-UX-3013'
      }
    ]);

    console.log('[Seed] Seeding Results...');

    // 7. Create Results for Event 4
    await Result.insertMany([
      {
        event: event4._id,
        student: student1._id,
        position: '1st Place (Gold Medal)',
        score: 96,
        remarks: 'Outstanding interactive prototype with clean typography and excellent accessibility compliance.',
        certificateIssued: true
      },
      {
        event: event4._id,
        student: student2._id,
        position: '2nd Place (Silver Medal)',
        score: 91,
        remarks: 'Creative micro-interactions and very cohesive component architecture.',
        certificateIssued: true
      },
      {
        event: event4._id,
        student: student3._id,
        position: 'Special Jury Mention',
        score: 87,
        remarks: 'Commendable user research insights and structured layout presentation.',
        certificateIssued: true
      }
    ]);

    console.log('[Seed] Seeding Notifications...');

    // 8. Create Notifications
    await Notification.insertMany([
      {
        user: studentUser1._id,
        message: 'Registration Confirmed: You are registered for "CodeSprint AI 2026"! Pass ID: REG-AI-9021',
        type: 'registration',
        link: `/events/${event1._id}`,
        isRead: false
      },
      {
        user: studentUser1._id,
        message: 'Congratulations! You won 1st Place in "Design Systems & Modern UI/UX Sprint"!',
        type: 'result',
        link: `/events/${event4._id}`,
        isRead: true
      },
      {
        user: presenterUser1._id,
        message: 'You have been assigned as Presenter for "National College Hackathon: CodeSprint AI 2026".',
        type: 'event',
        link: `/events/${event1._id}`,
        isRead: false
      },
      {
        user: admin._id,
        message: 'System Status: Database initialized with 5 events, 3 presenters, and student registrations.',
        type: 'general',
        isRead: false
      }
    ]);

    console.log('====================================================');
    console.log('  SEED DATA GENERATION COMPLETED SUCCESSFULLY!      ');
    console.log('====================================================');
    console.log('Demo Accounts for Instant Login:');
    console.log('1. Admin:      admin@college.edu        / adminpassword123');
    console.log('2. Presenter:  dr.sarah@college.edu     / presenter123');
    console.log('3. Student:    alex.morgan@college.edu   / student123');
    console.log('====================================================');

    if (require.main === module) {
      await closeDB();
      process.exit(0);
    }
  } catch (err) {
    console.error('[Seed Error]', err);
    if (require.main === module) {
      process.exit(1);
    }
  }
};

module.exports = seedData;

if (require.main === module) {
  seedData();
}
