import React, { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [flavors, setFlavors] = useState([]);
  const [stores, setStores] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/flavors')
      .then(r => r.json())
      .then(setFlavors);

    fetch('http://localhost:3001/stores')
      .then(r => r.json())
      .then(setStores);
  }, []);

  return (
    <div>
      <h1>Bret's Locator</h1>
      <h2>Saveurs</h2>
      <ul>
        {flavors.map(f => <li key={f.id}>{f.name}</li>)}
      </ul>
      <h2>Magasins</h2>
      <ul>
        {stores.map(s => <li key={s.id}>{s.name} - {s.address}</li>)}
      </ul>
    </div>
  )
}

export default App
