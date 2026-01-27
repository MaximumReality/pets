const { useState, useEffect, useRef } = React;

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

const speciesSprites = {
  bunny: "bunny.png",
  frog: "frog.png",
  fox: "fox.png",
  cat: "cat.png",
  dragon: "dragon.png",
  unicorn: "unicorn.png",
  dog: "dog.png"
};

const defaultPets = [
  { name: "AzulCat", species: "cat" },
  { name: "Fluffy", species: "dragon" },
  { name: "Froggy", species: "frog" },
  { name: "BunnyHop", species: "bunny" },
  { name: "Sparkle", species: "unicorn" },
  { name: "Foxy", species: "fox" },
  { name: "Casper", species: "dog" }
];

const foodEmojis = {
  dog: "🥩",
  frog: "🪰",
  cat: "🐠",
  dragon: "🍖",
  unicorn: "🍎",
  bunny: "🥕",
  fox: "🍔"
};

// Zones for pets
const zones = {
  cat: { xMin: 200, xMax: 400, yMin: 300, yMax: 400 },
  dragon: { xMin: 400, xMax: 600, yMin: 50, yMax: 150 },
  frog: { xMin: 50, xMax: 150, yMin: 400, yMax: 450 },
  bunny: { xMin: 500, xMax: 700, yMin: 400, yMax: 500 },
  unicorn: { xMin: 300, xMax: 500, yMin: 250, yMax: 350 },
  fox: { xMin: 600, xMax: 700, yMin: 350, yMax: 450 },
  dog: { xMin: 350, xMax: 450, yMin: 400, yMax: 450 }
};

function App() {
  const [pets, setPets] = useState([]);
  const [currentPet, setCurrentPet] = useState(null);
  const [stats, setStats] = useState({});
  const petRef = useRef();

  // Fetch pets from Firebase
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
            sprite: speciesSprites[speciesKey],
            stats: { hunger: 50, happiness: 50, energy: 50, health: 100 },
            lastUpdated: Date.now()
          });
        }
      }
      const newSnapshot = await db.collection("pets").get();
      setPets(newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchPets();
  }, []);

  // Render call buttons
  useEffect(() => {
    const bar = document.getElementById("callBar");
    bar.innerHTML = "";
    pets.forEach(pet => {
      const btn = document.createElement("button");
      btn.innerText = pet.name;
      btn.onclick = () => summonPet(pet);
      bar.appendChild(btn);
    });
  }, [pets]);

  // Summon pet
  const summonPet = (pet) => {
    setCurrentPet(pet);
    setStats(pet.stats);
  };

  // Feed pet
  const feedPet = async () => {
    if (!currentPet) return;
    const updatedStats = { ...stats };
    updatedStats.hunger = Math.max(0, updatedStats.hunger - 20);
    updatedStats.happiness = Math.min(100, updatedStats.happiness + 5);
    setStats(updatedStats);

    // Spawn food
    const food = document.createElement("div");
    food.className = "food";
    food.innerText = foodEmojis[currentPet.species];
    const x = Math.random() * 50 + (parseInt(petRef.current.style.left) || 200);
    const y = Math.random() * 50 + (parseInt(petRef.current.style.top) || 200);
    food.style.left = `${x}px`;
    food.style.top = `${y}px`;
    document.body.appendChild(food);
    setTimeout(() => document.body.removeChild(food), 2000);

    await db.collection("pets").doc(currentPet.id).update({
      stats: updatedStats,
      lastUpdated: Date.now()
    });
  };

  // Pet movement
  useEffect(() => {
    if (!currentPet) return;
    const interval = setInterval(() => {
      if (!petRef.current) return;
      const zone = zones[currentPet.species];
      const x = Math.random() * (zone.xMax - zone.xMin) + zone.xMin;
      const y = Math.random() * (zone.yMax - zone.yMin) + zone.yMin;
      petRef.current.style.left = `${x}px`;
      petRef.current.style.top = `${y}px`;
    }, 1500);
    return () => clearInterval(interval);
  }, [currentPet]);

  return (
    React.createElement(React.Fragment, null,
      currentPet && React.createElement("img", {
        ref: petRef,
        className: "pet",
        src: currentPet.sprite,
        alt: currentPet.species
      }),
      currentPet && React.createElement("div", {
        className: "stats-box",
        style: {
          left: (parseInt(petRef.current?.style.left) || 200) + 110 + "px",
          top: (parseInt(petRef.current?.style.top) || 200) + "px"
        }
      }, 
        `Hunger: ${Math.round(stats.hunger)} | ` +
        `Happiness: ${Math.round(stats.happiness)} | ` +
        `Energy: ${Math.round(stats.energy)} | ` +
        `Health: ${Math.round(stats.health)} `,
        React.createElement("br", null),
        React.createElement("button", { onClick: feedPet }, "Feed")
      )
    )
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  React.createElement(App)
);
