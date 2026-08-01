import { Routes, Route, useLocation } from 'react-router'
import Nav from './components/Nav'
import Footer from './components/Footer'
import StaticUnavailable from './pages/StaticUnavailable'
import { lazy, Suspense, useEffect } from 'react'
import { IS_STATIC_DEMO } from './lib/staticDemo'

const Home = lazy(() => import('./pages/Home'))
const Explore = lazy(() => import('./pages/Explore'))
const JourneyDetail = lazy(() => import('./pages/JourneyDetail'))
const Create = IS_STATIC_DEMO
  ? () => <StaticUnavailable feature="Atlas AI Studio" />
  : lazy(() => import('./pages/Create'))
const Planner = IS_STATIC_DEMO
  ? () => <StaticUnavailable feature="AI trip planning" />
  : lazy(() => import('./pages/Planner'))
const TravelDna = IS_STATIC_DEMO
  ? () => <StaticUnavailable feature="Travel DNA" />
  : lazy(() => import('./pages/TravelDna'))
const Glasses = IS_STATIC_DEMO
  ? () => <StaticUnavailable feature="Atlas Lens companion features" />
  : lazy(() => import('./pages/Glasses'))
const Login = IS_STATIC_DEMO
  ? () => <StaticUnavailable feature="Sign in and account access" />
  : lazy(() => import('./pages/Login'))
const NotFound = lazy(() => import('./pages/NotFound'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])
  return null
}

function RouteLoading() {
  return (
    <div className="bg-atlas-wash min-h-screen px-4 pt-28 sm:px-6">
      <div className="glass mx-auto h-[60vh] max-w-6xl animate-pulse rounded-atlas-lg" />
    </div>
  )
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Nav />
      <main className="relative z-0">
        <Suspense fallback={<RouteLoading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/journey/:slug" element={<JourneyDetail />} />
            <Route path="/create" element={<Create />} />
            <Route path="/planner" element={<Planner />} />
            <Route path="/dna" element={<TravelDna />} />
            <Route path="/glasses" element={<Glasses />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/unavailable"
              element={IS_STATIC_DEMO ? <StaticUnavailable /> : <NotFound />}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
