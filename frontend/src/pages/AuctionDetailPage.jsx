import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

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

export default function AuctionDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [bidding, setBidding] = useState(false);
  const [message, setMessage] = useState('');

  const fetchAuction = () => {
    api.get(`/auctions/${id}`)
      .then(r => {
        setAuction(r.data.auction);
        const min = parseFloat(r.data.auction.current_price || r.data.auction.starting_price) + 1;
        setBidAmount(min.toFixed(2));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAuction();
    const interval = setInterval(fetchAuction, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const handleBid = async (e) => {
    e.preventDefault();
    if (!user) { setMessage('Please login to place a bid.'); return; }
    setBidding(true);
    setMessage('');
    try {
      const { data } = await api.post(`/auctions/${id}/bid`, { amount: parseFloat(bidAmount) });
      setMessage('Bid placed successfully! ✓');
      fetchAuction();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to place bid.');
    }
    setBidding(false);
  };

  if (loading) return <div className="page"><div className="container"><div className="loading"><div className="spinner" /></div></div></div>;
  if (!auction) return <div className="page"><div className="container"><div className="empty-state"><h3>Auction not found</h3></div></div></div>;

  const currentPrice = parseFloat(auction.current_price || auction.starting_price);

  return (
    <div className="page">
      <div className="container">
        <Link to="/auctions" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>← Back to Auctions</Link>

        <div className="product-detail" style={{ marginTop: '24px' }}>
          <div className="product-gallery">
            <img
              src={auction.product?.images?.[0] || `https://placehold.co/600x600/1A1A25/CC5500?text=Auction`}
              alt={auction.product?.name}
            />
          </div>

          <div className="product-info">
            <span className={`status-badge ${auction.status}`} style={{ marginBottom: '12px', display: 'inline-block' }}>
              {auction.status === 'active' ? '🔴 Live Auction' : auction.status === 'upcoming' ? '⏳ Upcoming' : '🏁 Ended'}
            </span>
            <h1>{auction.product?.name}</h1>
            <div className="product-meta">
              <span>By {auction.artisan?.first_name} {auction.artisan?.last_name}</span>
              <span>{auction.bid_count || 0} bids</span>
            </div>

            {auction.product?.description && (
              <div className="product-description">{auction.product.description}</div>
            )}

            {auction.status === 'active' && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Ends In</div>
                <CountdownTimer endTime={auction.end_time} />
              </div>
            )}

            <div className="bid-section">
              <div className="bid-current">
                <div className="label">{auction.bid_count > 0 ? 'Current Highest Bid' : 'Starting Price'}</div>
                <div className="amount">GHS {currentPrice.toFixed(2)}</div>
              </div>

              {auction.status === 'active' && (
                <form onSubmit={handleBid}>
                  <div className="form-group">
                    <label>Your Bid (GHS)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      min={currentPrice + 0.01}
                      step="0.01"
                      required
                    />
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%' }} disabled={bidding}>
                    {bidding ? 'Placing Bid...' : `🔨 Place Bid — GHS ${parseFloat(bidAmount || 0).toFixed(2)}`}
                  </button>
                  {message && (
                    <div className={`alert ${message.includes('✓') ? 'alert-success' : 'alert-error'}`} style={{ marginTop: '12px' }}>{message}</div>
                  )}
                </form>
              )}

              {auction.status === 'ended' && auction.winner && (
                <div className="alert alert-success" style={{ textAlign: 'center' }}>
                  🏆 Won by {auction.winner.first_name} {auction.winner.last_name}
                </div>
              )}
            </div>

            {/* Bid History */}
            {auction.bids?.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <h3 style={{ marginBottom: '16px' }}>Bid History</h3>
                <div className="bid-history">
                  {auction.bids.map((bid, i) => (
                    <div key={bid.id} className="bid-item">
                      <div>
                        <div className="bidder">{i === 0 ? '👑 ' : ''}{bid.bidder?.first_name} {bid.bidder?.last_name}</div>
                        <div className="bid-time">{new Date(bid.created_at).toLocaleString()}</div>
                      </div>
                      <div className="bid-amount">GHS {parseFloat(bid.amount).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
