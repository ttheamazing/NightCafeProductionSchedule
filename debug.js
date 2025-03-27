// Add this to the end of your index.html file temporarily for debugging
console.log('Checking localStorage:');
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    console.log(key + ':', localStorage.getItem(key));
}
