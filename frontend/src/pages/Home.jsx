import React from "react";
import { Link, NavLink } from "react-router-dom";
import { FaBox, FaChartLine, FaWallet, FaFileInvoiceDollar } from "react-icons/fa";
import { Tab } from "react-admin";

const Home = () => {
  return (
    <div className="home-page-container">
      <div className="two-column-layout">
        {/* Left Column */}
        <div className="left-column">
          <div className="intro-section">
            {/*<p className="description">
            <span className="text-sky-500"><strong>Bright</strong></span>
            <span className="text-sky-700"><strong>Clean</strong></span> is an in-house web application designed to streamline
              your detergent business operations. It provides a comprehensive
              platform to:
            </p> */}
            <ul className="feature-list">
              <li>
              <NavLink to="/product-list"><strong>Products</strong></NavLink>
              </li>
              <li>
              <NavLink to="/sales"><strong>Sales</strong></NavLink>
              </li>
              <li>
              <NavLink to="/expenses"><strong>Expenses</strong></NavLink>
              </li>
              <li>
              <NavLink to="/accounting"><strong>Accounting</strong></NavLink>
              </li>
            </ul>
            {/*<p className="conclusion">
              Manage your operations seamlessly with BrightClean,
              ensuring better decision-making and productivity.
            </p>*/}
          </div>
        </div>

        {/* Right Column */}

        <div className="right-column">
          <div className="navigation-grid">
            <Link to="/product-list" className="title-icon">
              <FaBox style={{ fontSize: "32px" }} />
              <span>Products</span>
            </Link>
            <Link to="/sales" className="title-icon">
              <FaChartLine style={{ fontSize: "32px" }} />
              <span>Sales</span>
            </Link>
            <Link to="/expenses" className="title-icon">
              <FaWallet style={{ fontSize: "32px" }} />
              <span>Expenses</span>
            </Link>
            <Link to="/accounting" className="title-icon">
              <FaFileInvoiceDollar style={{ fontSize: "32px" }} />
              <span>Accounting</span>
            </Link>
          </div>
        </div> 

      </div>
    </div>
  );
};

export default Home;
