import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {supabase} from '../../supabaseClient';
import {Ornament} from '../Ornament';

const Cart = () => {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalPrice, setTotalPrice] = useState(0);

    useEffect(() => {
        fetchCartItems();
    }, []);

    const fetchCartItems = async () => {
        try{
            const {data: {session}} = await supabase.auth.getSession();

            if(!session){
                alert("로그인이 필요합니다.");
                navigate('/login');
                return;
            }

            const response = await fetch('http://localhost:8080/api/cart', {
                method: 'GET',
                headers: {
                    'Authorization' : `Bearer ${session.access_token}`,
                    'Content-type': 'application/json',
                },
            });

            if(response.ok){
                const json = await response.json();
                setCartItems(json.data);
                const total = json.data.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                setTotalPrice(total);
            } else {
                console.error("장바구니 불러오기 실패");
        
            }

        } catch (error) {
            console.error("에러 발생:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (cartId, currentQuantity, change) => {
        const newQuantity = currentQuantity + change;

        if (newQuantity < 1) return;

        try{
            const {data: {session}} = await supabase.auth.getSession();

            const response = await fetch(`http://localhost:8080/api/cart/${cartId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization' : `Bearer ${session.access_token}`,
                    'Content-Type' : `application/json`,
                },
                body: JSON.stringify({quantity: newQuantity})
            });

            if (response.ok){
                const updatedItems = cartItems.map(item => 
                    item.cartId === cartId ? {...item, quantity: newQuantity} : item
                );
                setCartItems(updatedItems);

                const total = updatedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                setTotalPrice(total);
            } else {
                console.error("수량 변경 실패");
            }
        } catch (error) {
            console.error("에러 발생:" , error);
        }
    }

    if (loading) 
        return <div className = "text-center pt-40">LOADING...</div>;

    return (
        <div className="min-h-screen bg-[#faf8f3] pt-12 pb-20 px-6 flex flex-col items-center">
            <div className="max-w-4xl w-full">
                {/* 헤더 */}
                <div className="text-center mb-16">
                    <div className="text-[#c9a961] text-[10px] tracking-[0.5em] mb-4 italic">YOUR SHOPPING BAG</div>
                    <Ornament className="mb-6" />
                    <h2 className="text-3xl font-serif text-[#1a1a1a]">CART</h2>
                </div>

                {/* 장바구니 리스트 */}
                {cartItems.length === 0 ? (
                    <div className="text-center py-20 text-[#8b8278] border-t border-b border-[#c9a961]/20">
                        <p>장바구니가 비어있습니다.</p>
                        <button 
                            onClick={() => navigate('/perfumes')}
                            className="mt-8 px-8 py-3 bg-[#1a1a1a] text-white text-xs tracking-widest hover:bg-[#c9a961] transition-colors"
                        >
                            SHOP NOW
                        </button>
                    </div>
                ) : (
                    <div className="bg-white border border-[#c9a961]/20 p-8 shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#c9a961]/30 text-[10px] tracking-widest text-[#8b8278]">
                                    <th className="pb-4 pl-2 font-normal">PRODUCT</th>
                                    <th className="pb-4 font-normal text-center">PRICE</th>
                                    <th className="pb-4 font-normal text-center">QUANTITY</th>
                                    <th className="pb-4 pr-2 font-normal text-right">TOTAL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cartItems.map((item) => (
                                    <tr key={item.cartId} className="border-b border-[#eee] last:border-0">
                                        <td className="py-6 pl-2">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-20 bg-gray-100 bg-cover bg-center" style={{ backgroundImage: `url(${item.imageUrl})` }}></div>
                                                <div>
                                                    <p className="text-[#1a1a1a] font-serif text-lg">{item.name}</p>
                                                    <p className="text-[10px] text-[#8b8278] tracking-widest mt-1">50ML / EAU DE PARFUM</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-6 text-center text-sm font-light">
                                            ₩{item.price.toLocaleString()}
                                        </td>
                                        <td className = "py-6 text-center">
                                            <div className = "flex items-center justify-center gap-3">
                                                {/* 마이너스 버튼 */}
                                                <button 
                                                    onClick = {() => updateQuantity(item.cartId, item.quantity, -1)}
                                                    className = "w-6 h-6 border border-[#c9a961] text-[#c9a961] flex items-center justify-center hover:bg-[#c9a961] hover:text-white transition-colors">
                                                - </button>
                                                
                                                {/* 수량 숫자 */}
                                                <span className = "text-sm w-4 text-center">{item.quantity}</span>
                                                
                                                {/* 플러습 버튼 */}
                                                <button
                                                    onClick = {() => updateQuantity(item.cartId, item.quantity, 1)}
                                                    className = "w-6 h-6 border border-[#c9a961] text-[#c9a961] flex items-center justify-center hover:bg-[#c9a961] hover:text-white transition-colors">
                                                + </button>    
                                            </div>
                                        </td>
                                        <td className="py-6 pr-2 text-right text-sm font-medium">
                                            ₩{(item.price * item.quantity).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* 총계 및 결제 버튼 */}
                        <div className="mt-10 flex flex-col items-end gap-6 pt-8 border-t border-[#c9a961]/30">
                            <div className="flex items-center gap-12 text-lg">
                                <span className="text-[#8b8278] font-serif italic">Total</span>
                                <span className="text-[#1a1a1a] font-bold">₩{totalPrice.toLocaleString()}</span>
                            </div>
                            <button className="px-12 py-4 bg-[#1a1a1a] text-white text-xs tracking-[0.2em] hover:bg-[#c9a961] transition-colors">
                                CHECKOUT
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cart;