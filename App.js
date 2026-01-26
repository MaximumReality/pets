<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Maximum Reality Pets</title>
  <style>
    body { 
      font-family: sans-serif; 
      padding: 20px; 
      background: url('bg_wp.jpg') no-repeat center center fixed;
      background-size: cover;
      color: #fff;
    }
    .pet-card { 
      border: 2px solid #fff; 
      padding: 10px; 
      margin: 10px; 
      display: inline-block; 
      width: 160px; 
      vertical-align: top; 
      text-align: center;
      background-color: rgba(0,0,0,0.5); 
      border-radius: 10px;
    }
    .pet-card img { 
      width: 80px; 
      height: 80px; 
      image-rendering: pixelated; 
      margin-bottom: 5px;
      border: 1px solid #fff;
      border-radius: 5px;
      background-color: #000;
    }
    input { 
      margin: 5px 0; 
      width: 100%; 
      padding: 5px;
      border-radius: 5px;
      border: 1px solid #ccc;
    }
    button { 
      margin-top: 5px; 
      cursor: pointer; 
      padding: 5px 10px;
      border-radius: 5px;
      border: none;
      background-color: #ffcc00;
      color: #000;
      font-weight: bold;
    }
    h1 { 
      text-align: center; 
      text-shadow: 2px 2px 4px #000;
    }
  </style>
</head>
<body>
  <div id="root"></div>

  <!-- Firebase -->
  <script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore-compat.js"></script>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>

  <script type="text/babel">
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

    const { useState, useEffect } = React;

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
      { name: "Azul", species: "cat" },
      { name: "Fluffy", species: "dragon" },
      { name: "Froggy", species: "frog" },
      { name: "BunnyHop", species: "bunny" },
      { name: "Sparkle", species: "unicorn" },
      { name: "Foxy", species: "fox" },
      { name: "Casper", species: "dog" }
    ];

    function App() {
      const [pets, setPets] = useState([]);
      const [newPetName, setNewPetName] = useState("");
      const [newPetSpecies, setNewPetSpecies] = useState("");

      // Fetch pets and seed if empty
      const fetchPets = async () => {
        const snapshot = await db.collection("pets").get();
        if (snapshot.empty) {
          for (let pet of defaultPets) {
            const key = pet.species.toLowerCase();
            await db.collection("pets").add({
              name: pet.name,
              species: key,
              sprite: speciesSprites[key] || "cat.png",
              stats: { hunger: 50, happiness: 50, energy: 50, health: 100 },
              lastUpdated: Date.now()
            });
          }
        }
        const newSnapshot = await db.collection("pets").get();
        setPets(newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      };

      useEffect(() => { fetchPets(); }, []);

      // Auto-update stats every 10 seconds
      useEffect(() => {
        const interval = setInterval(async () => {
          const updatedPets = await Promise.all(pets.map(async pet => {
            const now = Date.now();
            const hoursPassed = (now - pet.lastUpdated) / (1000 * 60 * 60);
            if (hoursPassed > 0) {
              const stats = { ...pet.stats };
              stats.hunger = Math.min(100, stats.hunger + 5 * hoursPassed);
              stats.happiness = Math.max(0, stats.happiness - 3 * hoursPassed);
              if (stats.hunger > 80 || stats.happiness < 20) {
                stats.health = Math.max(0, stats.health - 5 * hoursPassed);
              }
              await db.collection("pets").doc(pet.id).update({
                stats,
                lastUpdated: now
              });
              return { ...pet, stats, lastUpdated: now };
            }
            return pet;
          }));
          setPets(updatedPets);
        }, 10000);
        return () => clearInterval(interval);
      }, [pets]);

      // Create new pet safely
      const createPet = async () => {
        if (!newPetName || !newPetSpecies) return;
        const key = newPetSpecies.toLowerCase();

        // Check for duplicates
        const exists = await db.collection("pets")
          .where("name", "==", newPetName)
          .where("species", "==", key)
          .get();
        if (!exists.empty) {
          alert("This pet already exists!");
          return;
        }

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
        await db.collection("pets").doc(id).update({ stats, lastUpdated: Date.now() });
        setPets(pets.map(p => p.id === id ? { ...p, stats } : p));
      };

      return React.createElement(
        "div",
        null,
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
              { key: pet.id, className: "pet-card" },
              React.createElement("h3", null, `${pet.name} (${pet.species})`),
              React.createElement("img", { src: pet.sprite, alt: pet.species }),
              React.createElement("div", null, `Hunger: ${Math.round(pet.stats.hunger)}`),
              React.createElement("div", null, `Happiness: ${Math.round(pet.stats.happiness)}`),
              React.createElement("div", null, `Energy: ${Math.round(pet.stats.energy)}`),
              React.createElement("div", null, `Health: ${Math.round(pet.stats.health)}`),
              React.createElement("button", { onClick: () => feedPet(pet.id) }, "Feed")
            )
          )
        )
      );
    }

    ReactDOM.render(React.createElement(App), document.getElementById("root"));
  </script>
</body>
</html>
