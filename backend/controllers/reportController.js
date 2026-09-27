const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Presenter = require('../models/Presenter');
const Student = require('../models/Student');
const Result = require('../models/Result');

// @desc    Get Event Summary Report
// @route   GET /api/reports/events
// @access  Private (Admin / Presenter)
exports.getEventReports = async (req, res, next) => {
  try {
    const events = await Event.find()
      .populate({
        path: 'presenter',
        populate: { path: 'user', select: 'name email' }
      })
      .sort('eventDate');

    const reportData = await Promise.all(
      events.map(async (event) => {
        const totalRegistrations = await Registration.countDocuments({
          event: event._id,
          registrationStatus: { $ne: 'cancelled' }
        });
        const attendedCount = await Registration.countDocuments({
          event: event._id,
          registrationStatus: 'attended'
        });
        const cancelledCount = await Registration.countDocuments({
          event: event._id,
          registrationStatus: 'cancelled'
        });

        const utilization = event.capacity > 0
          ? ((totalRegistrations / event.capacity) * 100).toFixed(1)
          : 0;

        return {
          eventId: event._id,
          title: event.title,
          category: event.category,
          venue: event.venue,
          eventDate: event.eventDate,
          startTime: event.startTime,
          endTime: event.endTime,
          capacity: event.capacity,
          presenterName: event.presenter?.user?.name || 'Unassigned',
          presenterDepartment: event.presenter?.department || 'N/A',
          status: event.status,
          totalRegistrations,
          attendedCount,
          cancelledCount,
          availableSeats: Math.max(0, event.capacity - totalRegistrations),
          utilizationPercentage: Number(utilization)
        };
      })
    );

    // Aggregated Metrics
    const totalEvents = reportData.length;
    const totalCapacity = reportData.reduce((acc, curr) => acc + curr.capacity, 0);
    const totalRegistrations = reportData.reduce((acc, curr) => acc + curr.totalRegistrations, 0);
    const totalAttended = reportData.reduce((acc, curr) => acc + curr.attendedCount, 0);
    const avgUtilization = totalCapacity > 0 ? ((totalRegistrations / totalCapacity) * 100).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      summary: {
        totalEvents,
        totalCapacity,
        totalRegistrations,
        totalAttended,
        avgUtilization: Number(avgUtilization)
      },
      events: reportData
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Student Registration Report
// @route   GET /api/reports/registrations
// @access  Private (Admin / Presenter)
exports.getRegistrationReports = async (req, res, next) => {
  try {
    const { eventId, department, status } = req.query;

    const registrations = await Registration.find()
      .populate('event', 'title category venue eventDate status capacity')
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name email' }
      })
      .sort('-registrationDate');

    let filtered = registrations.filter(r => r.event && r.student && r.student.user);

    if (eventId) {
      filtered = filtered.filter(r => r.event._id.toString() === eventId);
    }
    if (department && department !== 'All') {
      filtered = filtered.filter(r => r.student.department === department);
    }
    if (status && status !== 'All') {
      filtered = filtered.filter(r => r.registrationStatus === status);
    }

    // Department-wise distribution
    const deptDistribution = {};
    filtered.forEach(r => {
      const dept = r.student?.department || 'Unknown';
      deptDistribution[dept] = (deptDistribution[dept] || 0) + 1;
    });

    const reportRows = filtered.map(r => ({
      registrationId: r._id,
      ticketCode: r.qrCodeToken,
      studentName: r.student?.user?.name || 'N/A',
      studentEmail: r.student?.user?.email || 'N/A',
      studentId: r.student?.studentId || 'N/A',
      department: r.student?.department || 'N/A',
      year: r.student?.year || 'N/A',
      phone: r.student?.phone || 'N/A',
      eventTitle: r.event?.title || 'N/A',
      eventCategory: r.event?.category || 'N/A',
      eventDate: r.event?.eventDate,
      venue: r.event?.venue || 'N/A',
      registrationStatus: r.registrationStatus,
      attended: r.attended,
      registrationDate: r.registrationDate
    }));

    res.status(200).json({
      success: true,
      totalCount: reportRows.length,
      deptDistribution,
      registrations: reportRows
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Presenter Engagement Report
// @route   GET /api/reports/presenters
// @access  Private (Admin)
exports.getPresenterReports = async (req, res, next) => {
  try {
    const presenters = await Presenter.find().populate('user', 'name email avatar');

    const presenterStats = await Promise.all(
      presenters.map(async (p) => {
        const events = await Event.find({ presenter: p._id });
        const eventIds = events.map(e => e._id);
        const totalRegistrations = await Registration.countDocuments({
          event: { $in: eventIds },
          registrationStatus: { $ne: 'cancelled' }
        });
        const totalAttended = await Registration.countDocuments({
          event: { $in: eventIds },
          registrationStatus: 'attended'
        });

        return {
          presenterId: p._id,
          name: p.user?.name || 'N/A',
          email: p.user?.email || 'N/A',
          designation: p.designation,
          department: p.department,
          contact: p.contact,
          totalAssignedEvents: events.length,
          events: events.map(e => ({ id: e._id, title: e.title, date: e.eventDate, status: e.status })),
          totalStudentsReached: totalRegistrations,
          totalAttendees: totalAttended
        };
      })
    );

    res.status(200).json({
      success: true,
      count: presenterStats.length,
      presenters: presenterStats
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Results & Awardees Report
// @route   GET /api/reports/results
// @access  Private (Admin / Presenter)
exports.getResultReports = async (req, res, next) => {
  try {
    const results = await Result.find()
      .populate('event', 'title category venue eventDate')
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name email' }
      })
      .sort('-createdAt');

    const formattedResults = results.map(r => ({
      resultId: r._id,
      eventTitle: r.event?.title || 'N/A',
      eventCategory: r.event?.category || 'N/A',
      eventDate: r.event?.eventDate,
      studentName: r.student?.user?.name || 'N/A',
      studentId: r.student?.studentId || 'N/A',
      department: r.student?.department || 'N/A',
      position: r.position,
      score: r.score,
      remarks: r.remarks,
      certificateIssued: r.certificateIssued
    }));

    res.status(200).json({
      success: true,
      count: formattedResults.length,
      results: formattedResults
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Export dynamic CSV data
// @route   GET /api/reports/export/csv
// @access  Private (Admin / Presenter)
exports.exportCSV = async (req, res, next) => {
  try {
    const { type = 'events' } = req.query;

    let csvContent = '';
    let filename = `report_${type}_${Date.now()}.csv`;

    if (type === 'events') {
      const events = await Event.find().populate({
        path: 'presenter',
        populate: { path: 'user', select: 'name' }
      });
      csvContent = 'Event Title,Category,Venue,Date,Start Time,End Time,Capacity,Presenter,Status\n';
      events.forEach(e => {
        csvContent += `"${e.title}","${e.category}","${e.venue}","${new Date(e.eventDate).toLocaleDateString()}","${e.startTime}","${e.endTime}",${e.capacity},"${e.presenter?.user?.name || 'Unassigned'}","${e.status}"\n`;
      });
    } else if (type === 'registrations') {
      const registrations = await Registration.find()
        .populate('event', 'title venue eventDate')
        .populate({
          path: 'student',
          populate: { path: 'user', select: 'name email' }
        });
      csvContent = 'Pass ID,Student Name,Email,Student ID,Department,Year,Phone,Event Title,Event Date,Venue,Status\n';
      registrations.forEach(r => {
        csvContent += `"${r.qrCodeToken}","${r.student?.user?.name || ''}","${r.student?.user?.email || ''}","${r.student?.studentId || ''}","${r.student?.department || ''}","${r.student?.year || ''}","${r.student?.phone || ''}","${r.event?.title || ''}","${r.event?.eventDate ? new Date(r.event.eventDate).toLocaleDateString() : ''}","${r.event?.venue || ''}","${r.registrationStatus}"\n`;
      });
    } else if (type === 'results') {
      const results = await Result.find()
        .populate('event', 'title')
        .populate({
          path: 'student',
          populate: { path: 'user', select: 'name email' }
        });
      csvContent = 'Event Title,Student Name,Student ID,Department,Position,Score,Remarks,Certificate Issued\n';
      results.forEach(r => {
        csvContent += `"${r.event?.title || ''}","${r.student?.user?.name || ''}","${r.student?.studentId || ''}","${r.student?.department || ''}","${r.position}",${r.score},"${r.remarks}",${r.certificateIssued ? 'Yes' : 'No'}\n`;
      });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};
