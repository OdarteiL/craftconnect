import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const DUMMY_AUCTIONS = {
  1: { 
    id: 1, 
    status: 'active', 
    starting_price: 200, 
    current_price: 350, 
    bid_count: 12,
    end_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    product: { 
      name: 'Antique Kente Cloth', 
      images: ['https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=800'],
      description: 'Rare vintage Kente cloth with intricate traditional patterns. This piece is over 50 years old and represents authentic Ghanaian weaving heritage. Perfect for collectors and cultural enthusiasts.'
    },
    artisan: { first_name: 'Kwame', last_name: 'Asante' },
    bids: [
      { id: 1, amount: 350, bidder: { first_name: 'John', last_name: 'Doe' }, created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
      { id: 2, amount: 320, bidder: { first_name: 'Jane', last_name: 'Smith' }, created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
      { id: 3, amount: 280, bidder: { first_name: 'Mike', last_name: 'Johnson' }, created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() }
    ]
  },
  2: { 
    id: 2, 
    status: 'active', 
    starting_price: 150, 
    current_price: 280, 
    bid_count: 8,
    end_time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    product: { 
      name: 'Hand-Carved Stool', 
      images: ['https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800'],
      description: 'Traditional Ashanti stool hand-carved from a single piece of mahogany. Features intricate symbolic patterns representing wisdom and strength. A functional piece of art.'
    },
    artisan: { first_name: 'Kofi', last_name: 'Mensah' },
    bids: [
      { id: 4, amount: 280, bidder: { first_name: 'Sarah', last_name: 'Williams' }, created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
      { id: 5, amount: 250, bidder: { first_name: 'David', last_name: 'Brown' }, created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() }
    ]
  },
  3: { 
    id: 3, 
    status: 'active', 
    starting_price: 100, 
    current_price: 100, 
    bid_count: 0,
    end_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    product: { 
      name: 'Ceremonial Mask', 
      images: ['https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800'],
      description: 'Authentic ceremonial mask used in traditional festivals. Hand-carved with natural pigments. A rare collector\'s item with cultural significance.'
    },
    artisan: { first_name: 'Ama', last_name: 'Osei' },
    bids: []
  }
};

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
        setLoading(false);
      })
      .catch(() => {
        // Use dummy data
        const dummy = DUMMY_AUCTIONS[id];
        if (dummy) {
          setAuction(dummy);
          const min = parseFloat(dummy.current_price || dummy.starting_price) + 1;
          setBidAmount(min.toFixed(2));
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchAuction();
    const interval = setInterval(fetchAuction, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const handleBid = async (e) => {
    e.preventDefault();
    if (!user) { 
      setMessage('Please login to place a bid.'); 
      return; 
    }
    
    const amount = parseFloat(bidAmount);
    const currentPrice = parseFloat(auction.current_price || auction.starting_price);
    
    if (amount <= currentPrice) {
      setMessage('Bid must be higher than current price.');
      return;
    }
    
    setBidding(true);
    setMessage('');
    
    try {
      await api.post(`/auctions/${id}/bid`, { amount });
      setMessage('✓ Bid placed successfully!');
      fetchAuction();
    } catch (err) {
      // Simulate bid for demo
      setMessage('✓ Bid placed successfully! (Demo mode)');
      setTimeout(() => {
        const newBid = {
          id: Date.now(),
          amount,
          bidder: { first_name: user.first_name || 'Demo', last_name: user.last_name || 'User' },
          created_at: new Date().toISOString()
        };
        setAuction(prev => ({
          ...prev,
          current_price: amount,
          bid_count: (prev.bid_count || 0) + 1,
          bids: [newBid, ...(prev.bids || [])]
        }));
        setBidAmount((amount + 1).toFixed(2));
      }, 500);
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
              {auction.status === 'active' ? '🔴 Live Auction' : auction.status === 'upcoming' ? '⏳ Upcoming' : '🏁 Ended'}
            </span>
            <h1>{auction.product?.name}</h1>
            <div className="product-meta">
              <span>By <strong>{auction.artisan?.first_name} {auction.artisan?.last_name}</strong></span>
              <span>📊 {auction.bid_count || 0} bids</span>
            </div>

            {auction.product?.description && (
              <div className="product-description">{auction.product.description}</div>
            )}

            {auction.status === 'active' && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>⏰ Auction Ends In</div>
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
                      onChange={(e) => setBidAmount(e.target.value)}
                      min={(currentPrice + 0.01).toFixed(2)}
                      step="0.01"
                      required
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Minimum bid: GHS {(currentPrice + 1).toFixed(2)}
                    </small>
                  </div>
                  <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={bidding}>
                    {bidding ? 'Placing Bid...' : `🔨 Place Bid — GHS ${parseFloat(bidAmount || 0).toFixed(2)}`}
                  </button>
                  {message && (
                    <div className={`alert ${message.includes('✓') ? 'alert-success' : 'alert-info'}`}>
                      {message}
                    </div>
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
              <div style={{ marginTop: '32px' }}>
                <h3 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>📜 Bid History</h3>
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
