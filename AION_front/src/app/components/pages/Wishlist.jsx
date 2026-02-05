import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {supabase} from '../../supabaseClient';
import {Ornament} from '../Ornament';

const Wishlist = () => {
    const navigate = useNavigate();
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWishlist();
    }, []);

    const fetchWishlist = async () => {
        try {
            const {data: {session}} = await supabase.auth.getSession();
            if(!session) {
                alert("로그인이 필요합니다.");
                navigate('/login');
                return;
            }

            const response = await fetch('http://localhost:8080/api/wishlist', {
                method: 'GET',
                headers : {
                    'Authorization' : `Bearer ${session.access_token}`,
                    'Content-Type' : 'application/json',
                },
            });

            if(response.ok){
                const json = await response.json();
                setWishlistItems(json.data);
            }
        } catch (error) {
            console.error("찜 목록 불러오기 실패: ",  error);
        } finally {
            setLoading(false);
        }
    };

    if (loading)
        return <div className = "text-center pt-40">LOADING...</div>;

    return (
        <div className="min-h-screen bg-[#faf8f3] pt-12 pb-20 px-6 flex flex-col items-center">
            <div className="max-w-4xl w-full">
                <div className="text-center mb-16">
                    <div className="text-[#c9a961] text-[10px] tracking-[0.5em] mb-4 italic">YOUR FAVORITES</div>
                    <Ornament className="mb-6" />
                    <h2 className="text-3xl font-serif text-[#1a1a1a]">WISHLIST</h2>
                </div>

                {wishlistItems.length === 0 ? (
                    <div className="text-center py-20 text-[#8b8278] border-t border-b border-[#c9a961]/20">
                        <p>찜한 상품이 없습니다.</p>
                        <button onClick={() => navigate('/perfumes')} className="mt-8 px-8 py-3 bg-[#1a1a1a] text-white text-xs tracking-widest hover:bg-[#c9a961] transition-colors cursor-pointer">
                            DISCOVER SCENTS
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                        {wishlistItems.map((item) => (
                            <div key={item.wishlistId} className="bg-white p-4 border border-[#eee] hover:border-[#c9a961]/50 transition-colors group">
                                <div className="aspect-[3/4] bg-gray-100 mb-4 bg-cover bg-center" style={{backgroundImage: `url(${item.imageUrl})`}}></div>
                                <h3 className="font-serif text-lg text-[#1a1a1a]">{item.name}</h3>
                                <p className="text-sm text-[#8b8278] mt-2">₩{item.price.toLocaleString()}</p>
                                <button className="w-full mt-4 py-2 border border-[#1a1a1a] text-[#1a1a1a] text-xs hover:bg-[#1a1a1a] hover:text-white transition-colors">
                                    ADD TO CART
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Wishlist;