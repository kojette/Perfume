// 자동으로 웹페이지 상단으로 올려주는 컴포넌트
import {useEffect} from "react";
import {useLocation} from "react-router-dom";

export default function ScrollToTop(){
    const {pathname} = useLocation();

    useEffect(() => {
        window.scrollTo(0,0);
    }, [pathname]);

    return null;
}