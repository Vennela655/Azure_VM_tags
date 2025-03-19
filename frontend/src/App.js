import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
    const [hierarchy, setHierarchy] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedResource, setSelectedResource] = useState(null);
    const [newTagInput, setNewTagInput] = useState(''); // Input for new tags
    const [newTags, setNewTags] = useState({}); // Combined tags (existing + new)

    useEffect(() => {
        const fetchHierarchy = async () => {
            try {
                const response = await fetch('http://172.190.16.223:5000/api/hierarchy');
                if (!response.ok) {
                    throw new Error('Failed to fetch hierarchy');
                }
                const data = await response.json();
                setHierarchy(data);
            } catch (err) {
                setError('Failed to fetch hierarchy');
            } finally {
                setLoading(false);
            }
        };

        fetchHierarchy();
    }, []);

    const updateTags = async () => {
        if (!newTags || typeof newTags !== 'object') {
            alert('Invalid tags format. Please enter valid key-value pairs.');
            return;
        }

        try {
            const response = await fetch('/api/tags', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    resourceId: selectedResource.id,
                    tags: newTags,
                }),
            });
            if (!response.ok) {
                throw new Error('Failed to update tags');
            }
            alert('Tags updated successfully!');
            setSelectedResource(null); // Close the modal after success
            setNewTagInput(''); // Clear the input
        } catch (err) {
            console.error(err);
            alert('Failed to update tags');
        }
    };

    const handleAddTag = () => {
        const [key, value] = newTagInput.split(':').map((part) => part.trim());
        if (!key || !value) {
            alert('Invalid tag format. Use "key:value".');
            return;
        }

        // Add the new tag to the existing tags
        setNewTags((prevTags) => ({
            ...prevTags,
            [key]: value,
        }));

        setNewTagInput(''); // Clear the input
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4 text-blue-600">Azure Resources Hierarchy</h1>
            {hierarchy.map((sub) => (
                <details key={sub.subscriptionId} className="mb-4 border rounded p-4 bg-gray-50">
                    <summary className="text-lg font-semibold text-gray-800">{sub.displayName}</summary>
                    {sub.resourceGroups.map((rg) => (
                        <details key={rg.name} className="ml-4 mb-2 border rounded p-2 bg-gray-100">
                            <summary className="text-gray-700 font-semibold">{rg.name}</summary>
                            <ul className="list-disc pl-6">
                                {rg.resources.map((res) => (
                                    <li
                                        key={res.id}
                                        className={`mb-2 p-2 border rounded-lg ${
                                            res.tags ? 'bg-green-100' : 'bg-red-100'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold">{res.name}</span>
                                            <button
                                                onClick={() => {
                                                    setSelectedResource(res);
                                                    setNewTags(res.tags || {}); // Initialize with existing tags
                                                }}
                                                className="ml-4 px-2 py-1 bg-blue-500 text-white rounded"
                                            >
                                                Edit Tags
                                            </button>
                                        </div>
                                        <p>Tags: {res.tags ? JSON.stringify(res.tags) : 'None'}</p>
                                    </li>
                                ))}
                            </ul>
                        </details>
                    ))}
                </details>
            ))}

            {selectedResource && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded shadow-lg w-1/2">
                        <h2 className="text-lg font-bold">Edit Tags for {selectedResource.name}</h2>

                        {/* Display existing and new tags */}
                        <div className="mt-4">
                            <h3 className="font-semibold">Current Tags:</h3>
                            <ul className="list-disc pl-6">
                                {Object.entries(newTags).map(([key, value]) => (
                                    <li key={key}>
                                        <strong>{key}:</strong> {value}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Input for new tags */}
                        <div className="mt-4">
                            <h3 className="font-semibold">Add New Tag:</h3>
                            <input
                                type="text"
                                placeholder="Enter tag in key:value format"
                                value={newTagInput}
                                onChange={(e) => setNewTagInput(e.target.value)}
                                className="border rounded p-2 w-full mt-2"
                            />
                            <button
                                onClick={handleAddTag}
                                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
                            >
                                Add Tag
                            </button>
                        </div>

                        {/* Save and Cancel buttons */}
                        <div className="flex justify-end mt-4">
                            <button
                                onClick={() => setSelectedResource(null)}
                                className="mr-2 px-4 py-2 bg-gray-500 text-white rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={updateTags}
                                className="px-4 py-2 bg-blue-500 text-white rounded"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;