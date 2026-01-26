// ===== Firebase config =====
const firebaseConfig = {
  apiKey: "AIzaSyDkpW7RAmX0wPmL757_GzEFIoU6snssLnA",
  authDomain: "pets-86c25.firebaseapp.com",
  projectId: "pets-86c25",
  storageBucket: "pets-86c25.firebasestorage.app",
  messagingSenderId: "556129222317",
  appId: "1:556129222317:web:12d323a5165eb222d59024"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ===== Sprites =====
const speciesSprites = {
  bunny: "bunny.png",
  frog: "frog.png",
  fox: "fox.png",
  cat: "cat.png",
  dragon: "dragon.png",
  unicorn: "unicorn.png",
  dog: "dog.png"
};

// React hooks
const { useState, useEffect } = React;

function App() {
  const [pets, setPets] = useState([]);
  const [newPetName, setNewPetName] = useState("");
  const [newPetSpecies, setNewPetSpecies] = useState("");

  // Default 7 pets to seed if Firestore is empty
  const defaultPets = [
    { name: "AzulCat", species: "cat" },
    { name: "Fluffy", species: "dragon" },
    { name: "Froggy", species: "frog" },
    { name: "BunnyHop", species: "bunny" },
    { name: "Sparkle", species: "unicorn" },
    { name: "Foxy", species: "fox" },
    { name: "Buddy", species: "dog" }
  ];

  // Fetch pets and seed if empty
  useEffect(() => {
    const fetchPets = async () => {
      const snapshot = await db.collection("pets").get();
      if (snapshot.empty) {
        // Seed default pets
        for (let pet of defaultPets) {
          const speciesKey = pet.species.toLowerCase();
          await db.collection("pets").add({
            name: pet.name,
            species: speciesKey,
            sprite: speciesSprites[speciesKey] || "cat.png",
            stats: { hunger: 50, happiness: 50, energy: 50, health: 100 },
            lastUpdated: Date.now()
          });
        }
        // Fetch again after seeding
        const newSnapshot = await db.collection("pets").get();
        const newPets = newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPets(newPets);
      } else {
        const existingPets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPets(existingPets);
      }
    };
    fetchPets();
  }, []);

  // Create new pet
  const createPet = async () => {
    if (!newPetName || !newPetSpecies) return;

    const key = newPetSpecies.toLowerCase();
    const pet = {
      name: newPetName,
      species: key,
      sprite: speciesSprites[key] || "cat.png",
      stats: { hunger: 50, happiness: 50, energy: 50, health: 100 },
      lastUpdated: Date.now()
    };

    const ref = await db.collection("pets").add(pet);
    setPets([...pets, { id: ref.id, ...pet }]);
    setNewPetName("");
    setNewPetSpecies("");
  };

  // Feed pet
  const feedPet = async (id) => {
    const pet = pets.find(p => p.id === id);
    if (!pet) return;

    const stats = { ...pet.stats };
    stats.hunger = Math.max(0, stats.hunger - 20);
    stats.happiness = Math.min(100, stats.happiness + 5);

    await db.collection("pets").doc(id).update({
      stats,
      lastUpdated: Date.now()
    });

    setPets(pets.map(p => p.id === id ? { ...p, stats } : p));
  };

  // Render
  return React.createElement(
    "div",
    { style: { padding: 20, fontFamily: "sans-serif" } },

    React.createElement("h1", null, "🐾 Maximum Reality Pets"),

    React.createElement(
      "div",
      null,
      React.createElement("input", {
        placeholder: "Pet Name",
        value: newPetName,
        onChange: e => setNewPetName(e.target.value)
      }),
      React.createElement("input", {
        placeholder: "Species",
        value: newPetSpecies,
        onChange: e => setNewPetSpecies(e.target.value)
      }),
      React.createElement("button", { onClick: createPet }, "Create Pet")
    ),

    React.createElement(
      "div",
      { style: { marginTop: 20 } },
      pets.map(pet =>
        React.createElement(
          "div",
          {
            key: pet.id,
            style: { border: "1px solid #ccc", padding: 10, marginBottom: 10 }
          },
          React.createElement("h2", null, `${pet.name} (${pet.species})`),
          React.createElement("img", {
            src: pet.sprite,
            alt: pet.species,
            width: 80,
            height: 80,
            style: { imageRendering: "pixelated" }
          }),
          React.createElement("div", null, `Hunger: ${pet.stats.hunger}`),
          React.createElement("div", null, `Happiness: ${pet.stats.happiness}`),
          React.createElement("div", null, `Energy: ${pet.stats.energy}`),
          React.createElement("div", null, `Health: ${pet.stats.health}`),
          React.createElement("button", { onClick: () => feedPet(pet.id) }, "Feed")
        )
      )
    )
  );
}

// ===== Mount React =====
ReactDOM.render(
  React.createElement(App),
  document.getElementById("root")
);
