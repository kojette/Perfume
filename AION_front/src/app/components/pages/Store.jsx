import React from 'react';
import {Ornament} from '../Ornament';

const Store = () => {
    const stores = [
        {city: "서울", name: "서울 올림포스점", address: "서울특별시 강남구 테헤란로 123", phone: "02-123-4567"},
        {city: "부산", name: "부산 아테네점", address: "부산광역시 해운대구 달맞이길 88", phone: "051-987-6543"},
        {city: "대구", name: "대구 헤라점", address: "대구광역시 중구 동성로 5", phone: "053-111-2222"},
        {city: "인천", name: "인천 포세이돈점", address: "인천광역시 연수구 송도과학로 32", phone: "032-333-4444"},
        {city: "광주", name: "광주 아레스점", address: "광주광역시 서구 상무중앙로 10", phone: "062-555-6666"},
        {city: "대전", name: "대전 헤르메스점", address: "대전광역시 서구 둔산로 100", phone: "042-777-8888"},
        {city:" 울산", name: "울산 아르테미스점", address: "울산광역시 남구 삼산로 20", phone: "052-999-0000"},
        {city: "제주", name: "제주 델포이점", address: "제주특별자치도 제주시 노형로 7", phone: "064-000-1111"},
    ];

    return (
        <div className = "min-h-screen bg-[#faf8f3] pt-16 pb=24 px-6">
            <div className = "max-w-7xl mx-auto">
                <div className = "text-center mb-24">
                    <div className = "text-[#c9a961] text-[10px] tracking-[0.5em] mb-4 italic uppercase">
                        Our Boutique
                    </div>
                    <h2 className = "font-display text-4xl tracking-[0.2em] text-[#2a2620] mb-8">
                        매장 안내
                    </h2>
                    <div className = "flex justify-center">
                        <Ornament className = "w-20 opacity-60" />
                    </div>

                    <div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-16">
                        {stores.map((store, index) => (
                            <div key={index} className = "flex flex-col space-y-3 group cursor-default">
                                <div className = "text-[#8b8278] text-[11px] tracking-[0.2em] italic uppercase">{store.city}</div>
                                <div className = "text-[#2a2620] text-sm font-medium tracking-widest border-b border-[#c9a961]/20 pb-2 group-hover:border-[#c9a961] transition-colors">
                                    {store.name}
                                </div>
                                <div className = "text-[#555] text-[12px] leading-relaxed">{store.address}</div>
                                <div className = "text-[#c9a961] text-[11px] tracking-wider italic">T. {store.phone}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Store;