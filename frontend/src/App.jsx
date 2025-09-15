import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Offers from './pages/Offers.jsx'
import OfferDetail from './pages/OfferDetail.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import PublishOffer from './pages/PublishOffer.jsx'
import Dashboard from './pages/Dashboard.jsx'
import OfferApplications from './pages/OfferApplications.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/offers/:id" element={<OfferDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/publish" element={<PublishOffer />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/offers/:id/applications" element={<OfferApplications />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
