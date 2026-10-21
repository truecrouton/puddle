import { ApolloWrapper } from "@/components/ApolloWrapper";
import SignInForm from "@/components/SignInForm";

export default async function Home() {
  return (
    <>
      <div className="max-lg:collapse bg-base-200 lg:mb-8 shadow-sm w-full rounded-md sticky top-0 z-50">
        <input id="navbar-1-toggle" className="peer hidden" type="checkbox" />
        <label htmlFor="navbar-1-toggle" className="fixed inset-0 hidden max-lg:peer-checked:block"></label>
        <div className="collapse-title navbar">
          <div className="navbar-start">
            <label htmlFor="navbar-1-toggle" className="btn btn-ghost lg:hidden">
              <svg aria-label="Menu" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" /></svg>
            </label>
            <a className="btn btn-ghost text-xl" href="/">Puddle</a>
          </div>
          <div className="navbar-end hidden lg:flex">
            <ul className="menu menu-horizontal px-1">
              <li>
                <details>
                  <summary>Parent</summary>
                  <ul className="p-2 bg-base-100 w-40 z-1">
                    <li><button>Submenu 1</button></li>
                    <li><button>Submenu 2</button></li>
                  </ul>
                </details>
              </li>
              <li><a href="/">Item 1</a></li>
              <li><button>Item 3</button></li>
            </ul>
          </div>
        </div>

        <div className="collapse-content lg:hidden z-1">
          <ul className="menu">
            <li><button>Item c1</button></li>
            <li>
              <button>Parent</button>
              <ul>
                <li><button>Submenu c1</button></li>
                <li><button>Submenu c2</button></li>
              </ul>
            </li>
            <li><button>Item c3</button></li>
          </ul>
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Home automation with mqtt</h1>
        </div>
        <h3>A simple home control and automation runner for mqtt. Provides an API for custom frontends or use the included web interface. Runs on node.js.</h3>
        <ApolloWrapper>
          <SignInForm />
        </ApolloWrapper>
      </main>
    </>

  );
}