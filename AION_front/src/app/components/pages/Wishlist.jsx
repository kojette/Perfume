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
                let items = json.data;

                if (items && items.length > 0) {
                    const perfumeIds = items.map(item => item.perfumeId);
                    const {data: images} = await supabase
                        .from('Perfume_Images')
                        .select('perfume_id, image_url')
                        .in('perfume_id', perfumeIds)
                        .eq('is_thumbnail', true);

                    const imageMap = {};
                    images?.forEach(img => {
                        imageMap[img.perfume_id] = img.image_url;
                    });

                    items = items.map(item => ({
                        ...item,
                        imageUrl : imageMap[item.perfumeId] || item.imageUrl || 'https://via.placeholder.com/300?text=No+Image'
                    }));
                }

                setWishlistItems(items);
            }
        } catch (error) {
            console.error("찜 목록 불러오기 실패: ",  error);
        } finally {
            setLoading(false);
        }
    };

    if (loading)
        return <div className = "text-center pt-40">LOADING...</div>;

    const handleDelete = async (wishlistId) => {
        if (!window.confirm("정말 삭제하시겠습니까?")) return;

        try {
            const {data: {session}} = await supabase.auth.getSession();
            const response = await fetch(`http://localhost:8080/api/wishlist/${wishlistId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization' : `Bearer ${session.access_token}`,
                },
            });

            if (response.ok) {
                alert("삭제되었습니다.");
                setWishlistItems(prev => prev.filter(item => item.wishlistId !== wishlistId));

            } else {
                alert("삭제 실패");
            }
        } catch (error) {
            console.error("삭제 중 오류 발생: ", error);
        }
    };

    const handleAddToCart = async (perfumeId) => {
        try {
            const {data: {session}} = await supabase.auth.getSession();
            if(!session) {
                alert("로그인이 필요합니다.");
                return;
            }

            const response = await fetch('http://localhost:8080/api/cart/add', {
                method : 'POST',
                headers : {
                    'Authorization' : `Bearer ${session.access_token}`,
                    'Content-Type' : 'application/json',
                },
                body : JSON.stringify({
                    perfumeId : perfumeId,
                    quantity : 1
                })
            });

            if(response.ok) {
                if(window.confirm("장바구니에 성공적으로 담겼습니다! 장바구니로 이동하시겠습니까?")) {
                    navigate('/cart');
                }
            } else {
                alert("장바구니 담기에 실패했습니다.");
            }
        } catch(error) {
            console.error("장바구니 담기 중 오류 발생: ", error);
        }
    }

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
                            <div key={item.wishlistId} className="relative bg-white p-4 border border-[#eee] hover:border-[#c9a961]/50 transition-colors group">
                                <button onClick={() => handleDelete(item.wishlistId)}
                                    className = "absolute top-2 right-1 text-gray-400 hover:text-red-500 cursor-pointer">
                                        x
                                    </button>
                                <div className = "aspect-[3/4] bg-white mb-4 bg-cover bg-center border border-[#eee] group-hover:border-[#c9a961]/50 transition-colors"
                                    style = {{
                                        backgroundImage: `url(${item.imageUrl})`
                                    }}></div>
                                <div className = "text-center">
                                    <h3 className="font-serif text-lg text-[#1a1a1a]">{item.name}</h3>
                                    <p className="text-sm text-[#8b8278] mt-2">₩{item.price.toLocaleString()}</p>
                                    <button 
                                        onClick = {() => handleAddToCart(item.perfumeId)}
                                        className="w-full mt-4 py-2 border border-[#1a1a1a] text-[#1a1a1a] text-xs hover:bg-[#1a1a1a] hover:text-white transition-colors cursor-pointer">
                                        ADD TO CART
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Wishlist;