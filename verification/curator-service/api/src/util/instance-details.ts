const urlMap: { [idx: string]: { [idx: string]: string } } = {
    'covid-19': {
        local: 'http://localhost:3002',
        dev: 'https://dev-data.covid-19.global.health',
        qa: 'https://qa-data.covid-19.global.health',
        prod: 'https://data.covid-19.global.health',
    },
};

export function baseURL(disease: string, environment: string): string {
    return urlMap[disease]?.[environment] ?? 'http://localhost:3002';
}

const welcomeMessages: { [idx: string]: string } = {
    'covid-19': `<p>Thank you for registering with Global.health! We're thrilled to have you join our international community and mission to advance the global response to infectious diseases through the sharing of trusted and open public health data.</p>
        <p>Here are a few things you can do:</p>
        <ul>
            <li>Filter and export <a href="https://data.covid-19.global.health">G.h Data</a> containing detailed information on over 50 million anonymized COVID-19 cases from over 100 countries.</li>
            <li>Explore the <a href="https://map.covid-19.global.health">G.h Map</a> to see available case data visualized by country, region, and coverage.</li>
            <li>Check out our <a href="https://global.health/faqs/">FAQs</a> for more information on our platform, process, team, data sources, citation guidelines, and plans for the future.</li>
            <li>Get involved! G.h is being built via a network of hundreds of volunteers that could use your help. If you're interested in joining us, please fill out this <a href="https://global.health/about/#get-involved">form</a>.</li>
            <li>Connect with us on <a href="https://twitter.com/globaldothealth">Twitter</a>, <a href="https://www.linkedin.com/company/globaldothealth">LinkedIn</a>, and <a href="https://github.com/globaldothealth">GitHub</a> for the latest news and updates.</li>
        </ul>
        <p>If you have any questions, suggestions, or connections don't hesitate to email us and a member of our team will be sure to follow up.</p>
        <p>Thank you again for your interest and support! We hope G.h proves valuable to your work and look forward to hearing from you.</p>
        <p>The G.h Team</p>`,
};

export function welcomeEmail(disease: string, email: string): string {
    const message = welcomeMessages[disease] ?? '';
    return `<p>Hello ${email},</p>\n${message}`;
}
