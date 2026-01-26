// ===== Firebase config =====
const firebaseConfig = {
  apiKey: "AIzaSyDkpW7RAmX0wPmL757_GzEFIoU6snssLnA",
  authDomain: "pets-86c25.firebaseapp.com",
  projectId: "pets-86c25",
  storageBucket: "pets-86c25.firebasestorage.app",
  messagingSenderId: "556129222317",
  appId: "1:556129222317:web:12d323a5165eb222d59024"
};
const speciesSprites = {
  bunny: "bunny.png",
  frog: "frog.png",
  fox: "fox.png",
  cat: "cat.png",
  dragon: "dragon.png",
  unicorn: "unicorn.png",
  dog: "dog.png"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// React hooks
const { useState, useEffect } = React;

function App() {
  const [pets, setPets] = useState([]);
  const [newPetName, setNewPetName] = useState("");
  const [newPetSpecies, setNewPetSpecies] = useState("");

  // Fetch pets and update stats
  const fetchPets = async () => {
    const snapshot = await db.collection("pets").get();
    const petsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const now = Date.now();
    const updatedPets = petsData.map(pet => {
      const hoursPassed = (now - pet.lastUpdated) / (1000 * 60 * 60);
      if (hoursPassed > 0) {
        const stats = { ...pet.stats };
        stats.hunger = Math.min(100, stats.hunger + 5 * hoursPassed);
        stats.happiness = Math.max(0, stats.happiness - 3 * hoursPassed);
        if (stats.hunger > 80 || stats.happiness < 20) stats.health = Math.max(0, stats.health - 5 * hoursPassed);
        return { ...pet, stats, lastUpdated: now };
      }
      return pet;
    });

    updatedPets.forEach(async pet => {
      await db.collection("pets").doc(pet.id).update({ stats: pet.stats, lastUpdated: pet.lastUpdated });
    });

    setPets(updatedPets);
  };

  useEffect(() => { fetchPets(); }, []);

  // Create pet
  const createPet = async () => {
  if (!newPetName || !newPetSpecies) return;

  const speciesKey = newPetSpecies.toLowerCase();

  const pet = {
    name: newPetName,
    species: speciesKey,
    sprite: speciesSprites[speciesKey] || "cat.png", // fallback
    stats: {
      hunger: 50,
      happiness: 50,
      energy: 50,
      health: 100
    },
    lastUpdated: Date.now()
  };

  const docRef = await db.collection("pets").add(pet);
  setPets([...pets, { id: docRef.id, ...pet }]);

  setNewPetName("");
  setNewPetSpecies("");
};

  // Feed pet
  const feedPet = async (id) => {
    const pet = pets.find(p => p.id === id);
    if (!pet) return;

    const updatedStats = { ...pet.stats };
    updatedStats.hunger = Math.max(0, updatedStats.hunger - 20);
    updatedStats.happiness = Math.min(100, updatedStats.happiness + 5);

    const updatedPet = { ...pet, stats: updatedStats, lastUpdated: Date.now() };
    await db.collection("pets").doc(id).update({ stats: updatedStats, lastUpdated: updatedPet.lastUpdated });
    setPets(pets.map(p => (p.id === id ? updatedPet : p)));
  };

  return (
 
    React.createElement('div', { style: { padding: 20, fontFamily: 'sans-serif' } },
      React.createElement('h1', null, '🐾 Maximum Reality Pets'),
      React.createElement('div', null,
        React.createElement('input', { placeholder: 'Pet Name', value: newPetName, onChange: e => setNewPetName(e.target.value) }),
        React.createElement('input', { placeholder: 'Species', value: newPetSpecies, onChange: e => setNewPetSpecies(e.target.value) }),
        React.createElement('button', { onClick: createPet }, 'Create Pet')
      ),
      React.createElement('div', { style: { marginTop: 20 } },
        pets.map(pet =>
          React.createElement('div', { key: pet.id, style: { border: '1px solid #ccc', padding: 10, marginBottom: 10 } },
         React.createElement('h2', null, `${pet.name} (${pet.species})`),
          
     React.createElement("img", {
  src: pet.sprite,
  alt: pet.species,
  style: {
    width: "80px",
    height: "80px",
    imageRendering: "pixelated"
  }
}),                   
                                 
            React.createElement('div', null, `Hunger: ${Math.round(pet.stats.hunger)}`),
            React.createElement('div', null, `Happiness: ${Math.round(pet.stats.happiness)}`),
            React.createElement('div', null, `Energy: ${Math.round(pet.stats.energy)}`),
            React.createElement('div', null, `Health: ${Math.round(pet.stats.health)}`),
            React.createElement('button', { onClick: () => feedPet(pet.id) }, 'Feed')
          )
        )
      )
    )
  );
}
