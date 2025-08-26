import React, { useState } from "react";
import Header from "./Header";
import StoreMapComponent from "./StoreMapComponent";

export default function App() {
  const [selectedFlavor, setSelectedFlavor] = useState(null);

  return (
    <div>
      <Header selectedFlavor={selectedFlavor} setSelectedFlavor={setSelectedFlavor} />
      <StoreMapComponent selectedFlavor={selectedFlavor} />
    </div>
  );
}
