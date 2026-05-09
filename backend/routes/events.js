const express = require('express');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');
const router = express.Router();

// Create event (admin only)
router.post('/', auth('admin'), async (req, res) => {
  try {
    const { title, description, date, seats, venue } = req.body;
    if (!title || !date || !seats) {
      return res.status(400).json({ msg: 'Title, date and seats are required' });
    }
    const event = new Event({ title, description, date, seats, venue });
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to create event' });
  }
});

// Get all events (any user)
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const filter = search ? { title: { $regex: search, $options: 'i' } } : {};
    const events = await Event.find(filter);
    res.json(events);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch events' });
  }
});

// Get bookings of logged-in user (user only) — must be BEFORE /:id to avoid route shadowing
router.get('/bookings/me', auth('user'), async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.userId }).populate('event');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch bookings' });
  }
});

// Get single event details
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch event' });
  }
});

// Update event (admin only)
router.put('/:id', auth('admin'), async (req, res) => {
  try {
    const updated = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ msg: 'Event not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to update event' });
  }
});

// Delete event (admin only)
router.delete('/:id', auth('admin'), async (req, res) => {
  try {
    const deleted = await Event.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ msg: 'Event not found' });
    res.json({ msg: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to delete event' });
  }
});

// Book a seat in an event (user only)
router.post('/book/:id', auth('user'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });

    if (event.bookedSeats >= event.seats) return res.status(400).json({ msg: 'No seats available' });

    // Prevent duplicate booking by same user
    const alreadyBooked = await Booking.findOne({ user: req.user.userId, event: event._id });
    if (alreadyBooked) return res.status(400).json({ msg: 'You have already booked this event' });

    event.bookedSeats += 1;
    await event.save();

    const booking = new Booking({
      user: req.user.userId,
      event: event._id
    });
    await booking.save();

    res.json({ msg: 'Seat booked', event, booking });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to book event' });
  }
});



module.exports = router;
