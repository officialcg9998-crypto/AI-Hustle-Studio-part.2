import { BrowserRouter, Routes, Route } from "react-router-dom";

function Home() {
  return <div style={{color:"white",background:"#040408",minHeight:"100vh",
    display:"flex",alignItems:"center",justifyContent:"center",fontSize:32}}>
    Hello World
  </div>;
}

export default function App() {
  return <Home />;
}

export function Root() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Home />} />
        <Route path="/dashboard" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
