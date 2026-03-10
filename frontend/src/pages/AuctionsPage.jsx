import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

function CountdownTimer({ endTime }) {
  const [time, setTime] = useState({});

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endTime) - new Date();
      if (diff <= 0) return { days: 0, hours: 0, mins: 0, secs: 0 };
      return {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000)
      };
    };
    setTime(calc());
    const interval = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <div className="auction-timer">
      <div className="time-block"><span className="value">{time.days || 0}</span><span className="unit">Days</span></div>
      <div className="time-block"><span className="value">{time.hours || 0}</span><span className="unit">Hrs</span></div>
      <div className="time-block"><span className="value">{time.mins || 0}</span><span className="unit">Min</span></div>
      <div className="time-block"><span className="value">{time.secs || 0}</span><span className="unit">Sec</span></div>
    </div>
  );
}

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState([]);
  const [status, setStatus] = useState('active');
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    api.get(`/auctions?status=${status}&page=${page}&limit=12`)
      .then(r => {
        setAuctions(r.data.auctions || []);
        setPagination(r.data.pagination || {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, page]);

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>🔨 Auctions</h1>
          <p>Bid on unique handcrafted items and find one-of-a-kind treasures</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', justifyContent: 'center' }}>
          {['active', 'upcoming', 'ended', 'all'].map(s => (
            <button
              key={s}
              className={`btn btn-sm ${status === s ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setStatus(s); setPage(1); }}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : auctions.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🔨</div>
            <h3>No {status} auctions</h3>
            <p>Check back soon for new auction listings.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-3">
              {auctions.map(auction => (
                <Link to={`/auctions/${auction.id}`} key={auction.id} className="card">
                  <div className="card-image">
                    <img
                      src={auction.product?.images?.[0] || `https://placehold.co/400x300/1A1A25/CC5500?text=Auction`}
                      alt={auction.product?.name}
                    />
                    <span className={`card-badge ${auction.status === 'active' ? 'auction' : ''}`}>
                      {auction.status === 'active' ? '🔴 Live' : auction.status === 'upcoming' ? '⏳ Upcoming' : '🏁 Ended'}
                    </span>
                  </div>
                  <div className="card-body">
                    <div className="card-subtitle">By {auction.artisan?.first_name} {auction.artisan?.last_name}</div>
                    <div className="card-title">{auction.product?.name || 'Auction Item'}</div>
                    
                    {auction.status === 'active' && <CountdownTimer endTime={auction.end_time} />}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {auction.bid_count > 0 ? 'Current Bid' : 'Starting Price'}
                        </div>
                        <div className="card-price">GHS {parseFloat(auction.current_price || auction.starting_price).toFixed(2)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bids</div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--terracotta)' }}>{auction.bid_count || 0}</div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '40px' }}>
                <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 16px', color: 'var(--text-muted)' }}>Page {page} of {pagination.pages}</span>
                <button className="btn btn-secondary btn-sm" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
