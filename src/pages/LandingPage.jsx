import React, { useEffect, useState } from 'react';

const LandingPage = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate page loading
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* ========================= preloader start ========================= */}
      {loading && (
        <div className="preloader">
          <div className="loader">
            <div className="spinner">
              <div className="spinner-container">
                <div className="spinner-rotator">
                  <div className="spinner-left">
                    <div className="spinner-circle"></div>
                  </div>
                  <div className="spinner-right">
                    <div className="spinner-circle"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* preloader end */}

      {/* ========================= header start ========================= */}
      <header className="header">
        <div className="navbar-area">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-lg-12">
                <nav className="navbar navbar-expand-lg">
                  <a className="navbar-brand" href="index.html">
                    <img src="assets/images/logo/eva3LogoFull.png" alt="Eva3 Logo" style={{ width: '150px' }} />
                  </a>
                  <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="toggler-icon"></span>
                    <span className="toggler-icon"></span>
                    <span className="toggler-icon"></span>
                  </button>
                  
                  <div className="collapse navbar-collapse sub-menu-bar" id="navbarSupportedContent">
                    <div className="ms-auto">
                      <ul id="nav" className="navbar-nav ms-auto">
                        <li className="nav-item">
                          <a className="page-scroll active" href="#home">Home</a>
                        </li>
                        <li className="nav-item">
                          <a className="page-scroll" href="#features">Features</a>
                        </li>
                        <li className="nav-item">
                          <a className="page-scroll" href="#pricing">Pricing</a>
                        </li>
                        <li className="nav-item">
                          <a className="" href="#0">About Us</a>
                        </li>
                        <li className="nav-item">
                          <a className="" href="#0">Contact</a>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="header-btn">
                    <a href="#0" className="main-btn btn-hover">Sign Up</a>
                    <a href="#0" className="main-btn btn-hover">Log In to My Eva3</a>
                  </div>
                  {/* navbar collapse */}
                </nav>
                {/* navbar */}
              </div>
            </div>
            {/* row */}
          </div>
          {/* container */}
        </div>
        {/* navbar area */}
      </header>
      {/* ========================= header end ========================= */}

      {/* ========================= hero-section start ========================= */}
      <section id="home" className="hero-section">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-xl-6 col-lg-6 col-md-10">
              <div className="hero-content">
                <h1>Eva3: Team Performance Simplified</h1>
                <p>Empowering your team through a robust platform focused on Quality, Comprehensive Evaluations, and Continuous Monitoring. Achieve excellence with Eva3.</p>
                
                <a href="#0" className="main-btn btn-hover">Learn More</a>
              </div>
            </div>
            <div className="col-xxl-6 col-xl-6 col-lg-6">
              <div className="hero-image text-center text-lg-end">
                <img src="assets/images/hero/hero-image.svg" alt="" />
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ========================= hero-section end ========================= */}

      {/* ========================= feature-section start ========================= */}
      <section id="features" className="feature-section">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-xxl-6 col-xl-7 col-lg-8 col-md-11">
              <div className="section-title text-center mb-60">
                <h2 className="mb-20">Pillars of Eva3: Elevating Team Performance</h2>
                <p>Discover how Eva3 revolutionizes team management with its core functionalities, designed to foster growth and productivity.</p>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-lg-4 col-md-6">
              <div className="single-feature">
                <div className="feature-icon">
                  <i className="lni lni-checkmark-circle"></i> {/* Icon for Quality */}
                </div>
                <div className="feature-content">
                  <h4>Quality Assurance</h4>
                  <p>Ensure consistent high standards across all team outputs with advanced quality checks and guidelines.</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="single-feature">
                <div className="feature-icon">
                  <i className="lni lni-stats-up"></i> {/* Icon for Evaluations */}
                </div>
                <div className="feature-content">
                  <h4>Comprehensive Evaluations</h4>
                  <p>Conduct thorough and fair assessments to identify strengths, weaknesses, and areas for improvement.</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="single-feature">
                <div className="feature-icon">
                  <i className="lni lni-eye"></i> {/* Icon for Monitoring */}
                </div>
                <div className="feature-content">
                  <h4>Continuous Monitoring</h4>
                  <p>Keep a real-time pulse on team performance and progress, enabling proactive adjustments and support.</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="single-feature">
                <div className="feature-icon">
                  <i className="lni lni-flow-tree"></i> {/* Icon for Workflow */}
                </div>
                <div className="feature-content">
                  <h4>Streamlined Workflow</h4>
                  <p>Optimize operational processes, reducing bottlenecks and enhancing overall team efficiency and collaboration.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ========================= feature-section end ========================= */}

      {/* ========================= feature-section-1 start ========================= */}
      <section id="feature-1" className="feature-section-1 mt-60 pt-40">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 order-last order-lg-first">
              <div className="feature-image text-center text-lg-start">
                <img src="assets/images/feature/feature-image-1.svg" alt="" />
              </div>
            </div>
            <div className="col-lg-6 col-md-10">
              <div className="feature-content-wrapper">
                <div className="section-title">
                  <h2 className="mb-20">Unlock Your Team's Full Potential</h2>
                  <p className="mb-30">Eva3 provides the tools you need to foster a high-performing team. With a focus on quality assurance, comprehensive evaluations, and continuous monitoring, your business can achieve new heights of success and efficiency. Simplify your team's performance management and drive excellence.</p>
                  <a href="#0" className="main-btn btn-hover">Discover More</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ========================= feature-section-1 end ========================= */}

      {/* ========================= pricing-section start ========================= */}
      <section id="pricing" className="pricing-section pt-120 pb-120">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-xxl-6 col-xl-7 col-lg-8 col-md-11">
              <div className="section-title text-center mb-60">
                <h2 className="mb-20">Flexible Plans for Every Team</h2>
                <p>Choose the Eva3 plan that best fits your team's size and needs. All plans include our core features for quality, evaluations, and monitoring.</p>
              </div>
            </div>
          </div>

          <div className="row justify-content-center">
            {/* Free Trial Plan Card */}
            <div className="col-lg-3 col-md-6 col-sm-10 mb-4">
              <div className="single-pricing-table" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e2e6ea', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', padding: '30px', transition: 'transform 0.3s ease-in-out' }}>
                <div className="pricing-header mb-4" style={{ textAlign: 'center' }}>
                  <h3 className="title" style={{ fontSize: '28px', fontWeight: '600', color: '#333' }}>Free Trial</h3>
                  <p className="text" style={{ fontSize: '16px', color: '#666' }}>Experience Eva3 for 7 days.</p>
                </div>
                <div className="price mb-4" style={{ textAlign: 'center', fontSize: '36px', fontWeight: '700', color: '#007bff' }}>
                  <span className="amount">Free</span>
                  <span className="duration">/7 days</span>
                </div>
                <div className="pricing-body mb-4">
                  <ul className="info" style={{ listStyle: 'none', padding: '0' }}>
                    <li style={{ marginBottom: '10px', fontSize: '15px', color: '#555' }}>Basic Features Included</li>
                    <li style={{ marginBottom: '10px', fontSize: '15px', color: '#555' }}>Limited User Access</li>
                    <li style={{ marginBottom: '10px', fontSize: '15px', color: '#555' }}>Email Support</li>
                    <li style={{ marginBottom: '10px', fontSize: '15px', color: '#555' }}>No Credit Card Required</li>
                  </ul>
                </div>
                <div className="pricing-btn" style={{ textAlign: 'center' }}>
                  <a href="#0" className="main-btn btn-hover" style={{ display: 'inline-block', padding: '12px 25px', backgroundColor: '#007bff', color: '#fff', textDecoration: 'none', borderRadius: '5px', transition: 'background-color 0.3s ease' }}>Start Free Trial</a>
                </div>
              </div>
            </div>

            {/* Starter Plan Card */}
            <div className="col-lg-3 col-md-6 col-sm-10 mb-4">
              <div className="single-pricing-table" style={{ backgroundColor: '#fff', border: '1px solid #dee2e6', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.05)', padding: '30px', transition: 'transform 0.3s ease-in-out' }}>
                <div className="pricing-header mb-4" style={{ textAlign: 'center' }}>
                  <h3 className="title" style={{ fontSize: '28px', fontWeight: '600', color: '#333' }}>Starter</h3>
                  <p className="text" style={{ fontSize: '16px', color: '#666' }}>For small teams getting started.</p>
                </div>
                <div className="price mb-4" style={{ textAlign: 'center', fontSize: '36px', fontWeight: '700', color: '#28a745' }}>
                  <span className="amount">$19</span>
                  <span className="duration">/month</span>
                </div>
                <div className="pricing-body mb-4">
                  <ul className="info" style={{ listStyle: 'none', padding: '0' }}>
                    <li style={{ marginBottom: '10px', fontSize: '15px', color: '#555' }}>Up to 5 Users</li>
                    <li style={{ marginBottom: '10px', fontSize: '15px', color: '#555' }}>Basic Quality Reports</li>
                    <li style={{ marginBottom: '10px', fontSize: '15px', color: '#555' }}>Standard Evaluation Templates</li>
                    <li style={{ marginBottom: '10px', fontSize: '15px', color: '#555' }}>Email Support</li>
                  </ul>
                </div>
                <div className="pricing-btn" style={{ textAlign: 'center' }}>
                  <a href="#0" className="main-btn btn-hover" style={{ display: 'inline-block', padding: '12px 25px', backgroundColor: '#28a745', color: '#fff', textDecoration: 'none', borderRadius: '5px', transition: 'background-color 0.3s ease' }}>Choose Plan</a>
                </div>
              </div>
            </div>
            
            {/* Professional Plan Card */}
            <div className="col-lg-3 col-md-6 col-sm-10 mb-4">
              <div className="single-pricing-table active" style={{ backgroundColor: '#e6f7ff', border: '2px solid #007bff', borderRadius: '10px', boxShadow: '0 8px 16px rgba(0,0,0,0.2)', padding: '35px', transition: 'transform 0.3s ease-in-out', transform: 'scale(1.05)' }}>
                <div className="pricing-header mb-4" style={{ textAlign: 'center' }}>
                  <h3 className="title" style={{ fontSize: '32px', fontWeight: '700', color: '#007bff' }}>Professional</h3>
                  <p className="text" style={{ fontSize: '18px', color: '#333' }}>Ideal for growing teams.</p>
                </div>
                <div className="price mb-4" style={{ textAlign: 'center', fontSize: '42px', fontWeight: '800', color: '#007bff' }}>
                  <span className="amount">$49</span>
                  <span className="duration">/month</span>
                </div>
                <div className="pricing-body mb-4">
                  <ul className="info" style={{ listStyle: 'none', padding: '0' }}>
                    <li style={{ marginBottom: '12px', fontSize: '16px', color: '#444', fontWeight: '500' }}>Up to 20 Users</li>
                    <li style={{ marginBottom: '12px', fontSize: '16px', color: '#444', fontWeight: '500' }}>Advanced Quality Reports</li>
                    <li style={{ marginBottom: '12px', fontSize: '16px', color: '#444', fontWeight: '500' }}>Customizable Evaluation Templates</li>
                    <li style={{ marginBottom: '12px', fontSize: '16px', color: '#444', fontWeight: '500' }}>Real-time Monitoring</li>
                    <li style={{ marginBottom: '12px', fontSize: '16px', color: '#444', fontWeight: '500' }}>Priority Email & Chat Support</li>
                  </ul>
                </div>
                <div className="pricing-btn" style={{ textAlign: 'center' }}>
                  <a href="#0" className="main-btn btn-hover" style={{ display: 'inline-block', padding: '15px 30px', backgroundColor: '#007bff', color: '#fff', textDecoration: 'none', borderRadius: '5px', transition: 'background-color 0.3s ease', fontWeight: '600' }}>Choose Plan</a>
                </div>
              </div>
            </div>
            
            {/* Enterprise Plan Card */}
            <div className="col-lg-3 col-md-6 col-sm-10 mb-4">
              <div className="single-pricing-table" style={{ backgroundColor: '#fff', border: '1px solid #dee2e6', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.05)', padding: '30px', transition: 'transform 0.3s ease-in-out' }}>
                <div className="pricing-header mb-4" style={{ textAlign: 'center' }}>
                  <h3 className="title" style={{ fontSize: '28px', fontWeight: '600', color: '#333' }}>Enterprise</h3>
                  <p className="text" style={{ fontSize: '16px', color: '#666' }}>For large organizations needing comprehensive features.</p>
                </div>
                <div className="price mb-4" style={{ textAlign: 'center', fontSize: '36px', fontWeight: '700', color: '#dc3545' }}>
                  <span className="amount">$99</span>
                  <span className="duration">/month</span>
                </div>
                <div className="pricing-body mb-4">
                  <ul className="info" style={{ listStyle: 'none', padding: '0' }}>
                    <li style={{ marginBottom: '10px', fontSize: '15px', color: '#555' }}>Unlimited Users</li>
                    <li style={{ marginBottom: '10px', fontSize: '15px', color: '#555' }}>Custom Quality Dashboards</li>
                    <li style={{ marginBottom: '10px', fontSize: '15px', color: '#555' }}>Advanced Analytics & Reporting</li>
                    <li style={{ marginBottom: '10px', fontSize: '15px', color: '#555' }}>Dedicated Account Manager</li>
                    <li style={{ marginBottom: '10px', fontSize: '15px', color: '#555' }}>24/7 Premium Support</li>
                  </ul>
                </div>
                <div className="pricing-btn" style={{ textAlign: 'center' }}>
                  <a href="#0" className="main-btn btn-hover" style={{ display: 'inline-block', padding: '12px 25px', backgroundColor: '#dc3545', color: '#fff', textDecoration: 'none', borderRadius: '5px', transition: 'background-color 0.3s ease' }}>Choose Plan</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ========================= pricing-section end ========================= */}

      {/* ========================= footer start ========================= */}
      <footer className="footer pt-160">
        <div className="container">
          <div className="row">
            <div className="col-xl-4 col-lg-4 col-md-6 col-sm-10">
              <div className="footer-widget">
                <div className="logo">
                  <a href="index.html"> <img src="assets/images/logo/eva3LogoFull.png" alt="Eva3 Logo" style={{ width: '150px' }} /> </a>
                </div>
                <p className="desc">Eva3: Team performance simplified. Your ultimate solution for quality, evaluations, and monitoring.</p>
              </div>
            </div>
            <div className="col-xl-2 col-lg-2 col-md-6 col-sm-6">
              <div className="footer-widget">
                <h3>Quick Links</h3>
                <ul className="links">
                  <li><a href="#home">Home</a></li>
                  <li><a href="#features">Features</a></li>
                  <li><a href="#pricing">Pricing</a></li>
                  <li><a href="#0">About</a></li>
                  <li><a href="#0">Contact</a></li>
                </ul>
              </div>
            </div>
            <div className="col-xl-3 col-lg-2 col-md-6 col-sm-6">
              <div className="footer-widget">
                <h3>Services</h3>
                <ul className="links">
                  <li><a href="#0">Quality Assurance</a></li>
                  <li><a href="#0">Team Evaluations</a></li>
                  <li><a href="#0">Performance Monitoring</a></li>
                  <li><a href="#0">Workflow Optimization</a></li>
                </ul>
              </div>
            </div>
            <div className="col-xl-3 col-lg-4 col-md-6">
              <div className="footer-widget">
                <h3>Follow On</h3>
                <ul className="social-links">
                  <li><a href="#0"><i className="lni lni-facebook"></i></a></li>
                  <li><a href="#0"><i className="lni lni-linkedin"></i></a></li>
                  <li><a href="#0"><i className="lni lni-instagram"></i></a></li>
                  <li><a href="#0"><i className="lni lni-twitter"></i></a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="container">
          <div className="copyright">
            <p>By Rodrigo Y.G. - All Rights Reserved.</p>
          </div>
        </div>
      </footer>
      {/* ========================= footer end ========================= */}

      {/* ========================= scroll-top ========================= */}
      <a href="#" className="scroll-top btn-hover">
        <i className="lni lni-chevron-up"></i>
      </a>
    </>
  );
};

export default LandingPage;