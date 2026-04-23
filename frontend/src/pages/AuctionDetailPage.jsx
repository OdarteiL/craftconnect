import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

function CountdownTimer({ endTime }) {
  const [time, setTime] = useState({});
  useEffect(() => {
    const calc = () => {
      const diff = new Date(endTime) - new Date();
      if (diff <= 0) return { days: 0, hours: 0, mins: 0, secs: 0, ended: true };
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

  if (time.ended) return <div className="auction-timer"><span style={{ color: 'var(--error)' }}>Auction Ended</span></div>;

  return (
    <div className="auction-timer">
      <div className="time-block"><span className="value">{time.days ?? 0}</span><span className="unit">Days</span></div>
      <div className="time-block"><span className="value">{time.hours ?? 0}</span><span className="unit">Hrs</span></div>
      <div className="time-block"><span className="value">{time.mins ?? 0}</span><span className="unit">Min</span></div>
      <div className="time-block"><span className="value">{time.secs ?? 0}</span><span className="unit">Sec</span></div>
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
  const [message, setMessage] = useState({ text: '', type: '' });
  const socketRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    // Initial fetch
    api.get(`/auctions/${id}`)
      .then(r => {
        setAuction(r.data.auction);
        const min = parseFloat(r.data.auction.current_price || r.data.auction.starting_price) + 1;
        setBidAmount(min.toFixed(2));
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Socket.io real-time updates
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000', {
      withCredentials: true
    });
    socketRef.current = socket;
    socket.emit('join:auction', id);

    socket.on('bid:new', (data) => {
      setAuction(prev => prev ? {
        ...prev,
        current_price: data.amount,
        bid_count: data.bid_count,
        bids: [{ id: Date.now(), amount: data.amount, bidder: data.bidder, created_at: data.created_at }, ...(prev.bids || [])]
      } : prev);
    });

    socket.on('auction:ended', (data) => {
      setAuction(prev => prev ? { ...prev, status: 'ended', winner: data.winner } : prev);
    });

    return () => {
      socket.emit('leave:auction', id);
      socket.disconnect();
    };
  }, [id]);

  const handleBid = async (e) => {
    e.preventDefault();
    if (!user) {
      setMessage({ text: 'Please login to place a bid.', type: 'error' });
      return;
    }

    const amount = parseFloat(bidAmount);
    const currentPrice = parseFloat(auction.current_price || auction.starting_price);

    if (amount <= currentPrice) {
      setMessage({ text: `Bid must be higher than GHS ${currentPrice.toFixed(2)}.`, type: 'error' });
      return;
    }

    setBidding(true);
    setMessage({ text: '', type: '' });

    try {
      await api.post(`/auctions/${id}/bid`, { amount });
      setMessage({ text: 'Bid placed successfully.', type: 'success' });
      // Socket will update the UI — just update minimum bid
      setBidAmount((amount + 1).toFixed(2));
    } catch (err) {
      setMessage({ text: err.response?.data?.error || 'Failed to place bid.', type: 'error' });
    }
    setBidding(false);
  };

  if (loading) return <div className="page"><div className="container"><div className="loading"><div className="spinner" /></div></div></div>;
  if (!auction) return <div className="page"><div className="container"><div className="empty-state"><h3>Auction not found</h3></div></div></div>;

  const currentPrice = parseFloat(auction.current_price || auction.starting_price);

  return (
    <div className="page">
      <div className="container">
        <Link to="/auctions" className="breadcrumb">← Back to Auctions</Link>

        <div className="product-detail" style={{ marginTop: '24px' }}>
          <div className="product-gallery">
            <img
              src={auction.product?.images?.[0] || `https://placehold.co/600x600/1A1A25/CC5500?text=Auction`}
              alt={auction.product?.name}
            />
          </div>

          <div className="product-info">
            <span className={`auction-status-badge ${auction.status}`}>
              {auction.status === 'active' ? 'Live Auction' : auction.status === 'upcoming' ? 'Upcoming' : 'Ended'}
            </span>
            <h1>{auction.product?.name}</h1>
            <div className="product-meta">
              <span>By <strong>{auction.artisan?.first_name} {auction.artisan?.last_name}</strong></span>
              <span>{auction.bid_count || 0} bids</span>
            </div>

            {auction.product?.description && (
              <div className="product-description">{auction.product.description}</div>
            )}

            {auction.status === 'active' && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Auction Ends In</div>
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
                    <label>Your Bid Amount (GHS)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={bidAmount}
                      onChange={e => setBidAmount(e.target.value)}
                      min={(currentPrice + 0.01).toFixed(2)}
                      step="0.01"
                      required
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Minimum bid: GHS {(currentPrice + 1).toFixed(2)}
                    </small>
                  </div>
                  <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={bidding}>
                    {bidding ? 'Placing Bid...' : `Place Bid — GHS ${parseFloat(bidAmount || 0).toFixed(2)}`}
                  </button>
                  {message.text && (
                    <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginTop: '12px' }}>
                      {message.text}
                    </div>
                  )}
                </form>
              )}

              {auction.status === 'ended' && (
                <div className="alert alert-success" style={{ textAlign: 'center' }}>
                  {auction.winner
                    ? `Won by ${auction.winner.first_name} ${auction.winner.last_name} — GHS ${currentPrice.toFixed(2)}`
                    : 'Auction ended with no bids.'}
                </div>
              )}

              {auction.status === 'upcoming' && (
                <div className="alert alert-info" style={{ textAlign: 'center' }}>
                  This auction has not started yet.
                </div>
              )}
            </div>

            {/* Bid History */}
            {auction.bids?.length > 0 && (
              <div style={{ marginTop: '32px' }}>
                <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: 600 }}>Bid History</h3>
                <div className="bid-history">
                  {auction.bids.map((bid, i) => (
                    <div key={bid.id} className="bid-item">
                      <div>
                        <div className="bidder">{i === 0 ? '— ' : ''}{bid.bidder?.first_name} {bid.bidder?.last_name}</div>
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
