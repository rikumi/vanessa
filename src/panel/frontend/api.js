import axios from 'axios';

export default axios.create({
    baseURL: '/api',
    headers: {
        'content-type': 'text/plain'
    }
});