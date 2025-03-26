// Sample data for the Gantt chart scheduler
const sampleData = {
    employees: [
        { id: 1, name: "Employee 1", global: true },
        { id: 2, name: "Employee 2", global: true },
        { id: 3, name: "OVEN", global: true }
    ],
    daySpecificEmployees: {
        // Format: "YYYY-MM-DD": [{ id: 101, name: "Temp Employee", global: false }]
    },
    products: [
        {
            id: 1,
            name: "Chocolate Chip Cookies",
            tasks: [
                { id: 101, name: "Measure ingredients", duration: 15 }, // duration in minutes
                { id: 102, name: "Mix cookie dough", duration: 30 },
                { id: 103, name: "Bake cookies", duration: 45 }
            ]
        },
        {
            id: 2,
            name: "Vanilla Cupcakes",
            tasks: [
                { id: 201, name: "Prepare batter", duration: 20 },
                { id: 202, name: "Fill cupcake liners", duration: 15 },
                { id: 203, name: "Bake cupcakes", duration: 25 },
                { id: 204, name: "Make frosting", duration: 20 },
                { id: 205, name: "Decorate cupcakes", duration: 30 }
            ]
        },
        {
            id: 3,
            name: "Bread Loaf",
            tasks: [
                { id: 301, name: "Mix dough", duration: 25 },
                { id: 302, name: "Knead dough", duration: 20 },
                { id: 303, name: "Let dough rise", duration: 120 },
                { id: 304, name: "Shape loaf", duration: 15 },
                { id: 305, name: "Bake bread", duration: 45 }
            ]
        }
    ],
    scheduledTasks: [] // Start with no scheduled tasks
};
