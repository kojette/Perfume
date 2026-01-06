import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { FeaturedProducts } from "./components/FeaturedProducts";
import { About } from "./components/About";
import { Newsletter } from "./components/Newsletter";
import { Footer } from "./components/Footer";
import Recommend from "./components/pages/Recommend";
import Login from './components/pages/Login';
import Signup from './components/pages/Signup';
import Mypage from './components/pages/Mypage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Header />

        <main>
          <Routes>
              <Route
                path="/"
                element={
                  <>
                    <Hero />
                    <FeaturedProducts />
                    <About />
                    <Newsletter />
                  </>
                } />

              <Route path="/recommend" element={<Recommend />} />
            
              <Route path='/login' element={<Login />} />
              <Route path='/signup' element={<Signup />} />
              <Route path="/mypage" element={<Mypage />} />
          </Routes>
        </main>

        <Footer />
        
      </div>
    </BrowserRouter>
  );
}
