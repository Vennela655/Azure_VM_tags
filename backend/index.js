const express = require('express');
const axios = require('axios');
const path = require('path');

const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

// Fetch hierarchy of subscriptions → resource groups → resources
const getAzureHierarchy = async () => {
    const azureApiVersion = '2021-04-01';
    const azureAccessToken = process.env.AZURE_ACCESS_TOKEN;

    try {
        // Fetch subscriptions
        const subscriptionsResponse = await axios.get(
            `https://management.azure.com/subscriptions?api-version=${azureApiVersion}`,
            {
                headers: {
                    Authorization: `Bearer ${azureAccessToken}`,
                },
            }
        );

        const hierarchy = [];

        for (const sub of subscriptionsResponse.data.value) {
            // Fetch resource groups for each subscription
            const resourceGroupsResponse = await axios.get(
                `https://management.azure.com/subscriptions/${sub.subscriptionId}/resourcegroups?api-version=${azureApiVersion}`,
                {
                    headers: {
                        Authorization: `Bearer ${azureAccessToken}`,
                    },
                }
            );

            const resourceGroups = [];

            for (const rg of resourceGroupsResponse.data.value) {
                // Fetch resources for each resource group
                const resourcesResponse = await axios.get(
                    `https://management.azure.com/subscriptions/${sub.subscriptionId}/resourceGroups/${rg.name}/resources?api-version=${azureApiVersion}`,
                    {
                        headers: {
                            Authorization: `Bearer ${azureAccessToken}`,
                        },
                    }
                );

                const resources = resourcesResponse.data.value.map((res) => ({
                    id: res.id,
                    name: res.name,
                    tags: res.tags,
                }));

                resourceGroups.push({
                    name: rg.name,
                    resources,
                });
            }

            hierarchy.push({
                subscriptionId: sub.subscriptionId,
                displayName: sub.displayName,
                resourceGroups,
            });
        }

        return hierarchy;
    } catch (error) {
        console.error('Error fetching Azure hierarchy:', error.response?.data || error.message);
        throw error;
    }
};

// Endpoint to fetch Azure hierarchy
app.get('/api/hierarchy', async (req, res) => {
    try {
        const hierarchy = await getAzureHierarchy();
        res.json(hierarchy);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch Azure hierarchy' });
    }
});

// Endpoint to update tags for a resource
app.put('/api/tags', async (req, res) => {
    const { resourceId, tags } = req.body;
    const azureAccessToken = process.env.AZURE_ACCESS_TOKEN;

    try {
        // Update tags for the resource
        const response = await axios.put(
            `https://management.azure.com${resourceId}/providers/Microsoft.Resources/tags/default?api-version=2021-04-01`,
            {
                properties: {
                    tags: tags,
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${azureAccessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        res.json({ message: 'Tags updated successfully', data: response.data });
    } catch (error) {
        console.error('Error updating tags:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to update tags' });
    }
});

// Default route
app.get('/', (req, res) => {
    res.send('Welcome to the Azure Tags API!');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
