import Head from 'next/head'

export default function Home() {
  return (
    <div className="container">
      <Head>
        <title>Curator UI</title>
      </Head>

      <main>
        <h1>Welcome to the Curator UI</h1>
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
      `}</style>
    </div>
  )
}
