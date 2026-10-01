import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Plus, Trash2, Calendar, MapPin, DollarSign, Save, Sparkles, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ItineraryBuilderPage() {
  const { user } = useAuth();
  const { formatCurrency } = useApp();
  const navigate = useNavigate();

  const [title, setTitle] = useState('My Custom South India Expedition');
  const [destination, setDestination] = useState('Kodaikanal & Madurai');
  const [startDate, setStartDate] = useState(() => new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]);
  const [budget, setBudget] = useState(25000);
  const [notes, setNotes] = useState('Include morning lake walks and evening temple exploration.');

  const [days, setDays] = useState([
    {
      dayNumber: 1,
      title: 'Arrival & Misty Pine Walk',
      activities: [
        { time: '09:00 AM', title: 'Pickup at Railway Station / Airport', activityType: 'Transport', cost: 1500, notes: 'Private AC Sedan' },
        { time: '12:30 PM', title: 'Check-in at Valley Resort', activityType: 'Hotel', cost: 4500, notes: 'Pine View Deluxe Suite' },
        { time: '04:30 PM', title: 'Kodai Lake Shikara Ride & Sunset', activityType: 'Sightseeing', cost: 800, notes: 'Pedal boat around star lake' }
      ]
    },
    {
      dayNumber: 2,
      title: 'Heritage & Food Trail',
      activities: [
        { time: '08:30 AM', title: 'Traditional South Indian Breakfast Feast', activityType: 'Meal', cost: 600, notes: 'Fresh idli, vada, and filter coffee' },
        { time: '11:00 AM', title: 'Coakers Walk & Pillar Rocks Viewpoint', activityType: 'Sightseeing', cost: 500, notes: 'Panoramic valley viewpoints' },
        { time: '06:00 PM', title: 'Famous Jigarthanda & Night Bazaar Stroll', activityType: 'Activity', cost: 400, notes: 'Authentic local treats' }
      ]
    }
  ]);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Compute live total cost
  const totalCost = days.reduce(
    (sum, day) => sum + day.activities.reduce((dSum, act) => dSum + Number(act.cost || 0), 0),
    0
  );

  const addDay = () => {
    setDays([
      ...days,
      {
        dayNumber: days.length + 1,
        title: `Day ${days.length + 1} Adventure`,
        activities: [
          { time: '09:00 AM', title: 'Morning Sightseeing & Trail', activityType: 'Sightseeing', cost: 1000, notes: '' }
        ]
      }
    ]);
  };

  const removeDay = (dayIdx) => {
    if (days.length <= 1) return;
    const updated = days.filter((_, i) => i !== dayIdx).map((d, i) => ({ ...d, dayNumber: i + 1 }));
    setDays(updated);
  };

  const addActivity = (dayIdx) => {
    const updated = [...days];
    updated[dayIdx].activities.push({
      time: '02:00 PM',
      title: 'New Activity',
      activityType: 'Sightseeing',
      cost: 500,
      notes: ''
    });
    setDays(updated);
  };

  const removeActivity = (dayIdx, actIdx) => {
    const updated = [...days];
    updated[dayIdx].activities = updated[dayIdx].activities.filter((_, i) => i !== actIdx);
    setDays(updated);
  };

  const handleSaveItinerary = async () => {
    if (!user) {
      alert('Please sign in to save your custom itinerary');
      navigate('/login');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/itinerary', {
        title,
        destination,
        startDate,
        endDate,
        daysCount: days.length,
        budget: Number(budget),
        totalEstimatedCost: totalCost,
        notes,
        days
      });

      if (res.data.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save itinerary');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="main-container">
      {/* Header */}
      <div className="travel-hero" style={{ padding: '24px 30px', marginBottom: '24px', background: 'var(--pastel-yellow-light)' }}>
        <span className="badge badge-pink" style={{ marginBottom: '6px' }}>DOODLE TRIP PLANNER</span>
        <h2 style={{ fontSize: '28px' }}>CUSTOM MULTI-DAY EXPEDITION BUILDER</h2>
        <p>Design your dream South Indian vacation day-by-day. Calculate costs live and save to your Explorer account.</p>
      </div>

      {savedSuccess && (
        <div className="card" style={{ background: 'var(--pastel-mint-light)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 color="#059669" size={24} />
          <strong>Custom Itinerary saved successfully to your Explorer Desk!</strong>
        </div>
      )}

      {/* Meta Configuration Grid */}
      <div className="card" style={{ marginBottom: '28px', background: '#fff' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Itinerary Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Destination</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Target Budget ({formatCurrency(budget)})</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="form-control"
            />
          </div>
        </div>
      </div>

      {/* Day by Day Scheduler */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
        {days.map((day, dayIdx) => (
          <div key={dayIdx} className="card" style={{ background: 'var(--surface-low)', border: '2.5px solid #000' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="badge badge-yellow">DAY {day.dayNumber}</span>
                <input
                  type="text"
                  value={day.title}
                  onChange={(e) => {
                    const updated = [...days];
                    updated[dayIdx].title = e.target.value;
                    setDays(updated);
                  }}
                  style={{ fontWeight: '800', fontSize: '16px', background: 'transparent', border: 'none', boxShadow: 'none' }}
                />
              </div>

              {days.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDay(dayIdx)}
                  className="btn btn-sm btn-outline"
                  style={{ color: '#dc2626' }}
                >
                  <Trash2 size={13} /> Remove Day
                </button>
              )}
            </div>

            {/* Activities Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
              {day.activities.map((act, actIdx) => (
                <div
                  key={actIdx}
                  style={{
                    background: '#fff',
                    border: '1.5px solid #000',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    display: 'grid',
                    gridTemplateColumns: '90px 1fr 130px 100px 40px',
                    gap: '10px',
                    alignItems: 'center'
                  }}
                >
                  <input
                    type="text"
                    value={act.time}
                    onChange={(e) => {
                      const updated = [...days];
                      updated[dayIdx].activities[actIdx].time = e.target.value;
                      setDays(updated);
                    }}
                    style={{ fontSize: '12px', fontWeight: '700', padding: '4px 6px', border: '1px solid #000' }}
                  />

                  <input
                    type="text"
                    placeholder="Activity name..."
                    value={act.title}
                    onChange={(e) => {
                      const updated = [...days];
                      updated[dayIdx].activities[actIdx].title = e.target.value;
                      setDays(updated);
                    }}
                    style={{ fontSize: '13px', fontWeight: '600', padding: '4px 6px', border: '1px solid #000' }}
                  />

                  <select
                    value={act.activityType}
                    onChange={(e) => {
                      const updated = [...days];
                      updated[dayIdx].activities[actIdx].activityType = e.target.value;
                      setDays(updated);
                    }}
                    style={{ fontSize: '12px', fontWeight: '700', padding: '4px 6px', border: '1px solid #000' }}
                  >
                    <option value="Sightseeing">Sightseeing</option>
                    <option value="Hotel">Hotel / Stay</option>
                    <option value="Transport">Transport</option>
                    <option value="Meal">Meal / Dining</option>
                    <option value="Activity">Adventure</option>
                  </select>

                  <input
                    type="number"
                    placeholder="₹ Cost"
                    value={act.cost}
                    onChange={(e) => {
                      const updated = [...days];
                      updated[dayIdx].activities[actIdx].cost = Number(e.target.value);
                      setDays(updated);
                    }}
                    style={{ fontSize: '13px', fontWeight: '800', padding: '4px 6px', border: '1px solid #000' }}
                  />

                  <button
                    type="button"
                    onClick={() => removeActivity(dayIdx, actIdx)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <button type="button" onClick={() => addActivity(dayIdx)} className="btn btn-sm btn-mint">
              <Plus size={13} /> Add Activity to Day {day.dayNumber}
            </button>
          </div>
        ))}
      </div>

      {/* Floating Action / Total Calculation Bar */}
      <div
        className="card"
        style={{
          background: 'var(--pastel-yellow)',
          border: '3px solid #000',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <button type="button" onClick={addDay} className="btn btn-outline" style={{ marginRight: '10px' }}>
            <Plus size={15} /> Add Another Day
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)' }}>TOTAL ESTIMATED COST</div>
            <div style={{ fontSize: '24px', fontWeight: '800' }}>
              {formatCurrency(totalCost)}
              <span style={{ fontSize: '12px', color: totalCost > budget ? '#dc2626' : '#059669', marginLeft: '8px' }}>
                ({totalCost <= budget ? `Within budget of ${formatCurrency(budget)}` : `Exceeds budget by ${formatCurrency(totalCost - budget)}`})
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveItinerary}
            disabled={saving}
            className="btn btn-primary"
            style={{ padding: '12px 24px', fontSize: '15px' }}
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save Expedition Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}
