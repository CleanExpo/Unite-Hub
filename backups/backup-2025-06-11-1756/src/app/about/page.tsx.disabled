Here's an enhanced, fully coded "About Us" page with animations and performance optimizations:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>About Us - Brisbane Business Consulting | [Your Company Name]</title>
    
    <!-- Performance Optimizations -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <link rel="preload" as="image" href="images/brisbane-skyline.webp">
    
    <!-- Meta Tags for SEO -->
    <meta name="description" content="Expert Brisbane-based consulting services. Local expertise, global standards. Helping Queensland businesses thrive since [Year].">
    <meta name="keywords" content="Brisbane consulting, Queensland business consultants, local business experts">
    
    <style>
        /* CSS Variables for easy theming */
        :root {
            --primary-color: #1a365d;
            --secondary-color: #2d5aa0;
            --accent-color: #f7941e; /* Brisbane orange */
            --text-color: #2d3748;
            --text-light: #718096;
            --background-light: #f7fafc;
            --white: #ffffff;
            --shadow: 0 10px 25px rgba(0,0,0,0.1);
            --shadow-hover: 0 20px 40px rgba(0,0,0,0.15);
            --border-radius: 12px;
            --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Reset and Base Styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: var(--text-color);
            background-color: var(--white);
            overflow-x: hidden;
        }

        /* Performance: Use will-change sparingly and remove after animation */
        .animate-on-scroll {
            opacity: 0;
            transform: translateY(30px);
            transition: var(--transition);
        }

        .animate-on-scroll.animate {
            opacity: 1;
            transform: translateY(0);
        }

        /* Container */
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }

        /* Header Hero Section */
        .hero {
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
            color: var(--white);
            padding: 120px 0 80px;
            position: relative;
            overflow: hidden;
        }

        .hero::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 300"><path d="M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,213.3C672,192,768,128,864,128C960,128,1056,192,1152,208C1248,224,1344,192,1392,176L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" fill="rgba(255,255,255,0.1)"/></svg>') bottom;
            background-size: cover;
            animation: wave 20s ease-in-out infinite;
        }

        @keyframes wave {
            0%, 100% { transform: translateX(0%) translateZ(0) scaleY(1); }
            50% { transform: translateX(-25%) translateZ(0) scaleY(0.55); }
        }

        .hero-content {
            position: relative;
            z-index: 2;
            text-align: center;
        }

        .hero h1 {
            font-size: clamp(2.5rem, 5vw, 4rem);
            font-weight: 700;
            margin-bottom: 1.5rem;
            animation: slideInFromTop 1s ease-out;
        }

        .hero .subtitle {
            font-size: clamp(1.1rem, 2.5vw, 1.5rem);
            margin-bottom: 2rem;
            opacity: 0.9;
            font-weight: 300;
            animation: slideInFromBottom 1s ease-out 0.3s both;
        }

        @keyframes slideInFromTop {
            0% { opacity: 0; transform: translateY(-50px); }
            100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideInFromBottom {
            0% { opacity: 0; transform: translateY(50px); }
            100% { opacity: 1; transform: translateY(0); }
        }

        /* Main Content Sections */
        .section {
            padding: 80px 0;
        }

        .section:nth-child(even) {
            background-color: var(--background-light);
        }

        .section-header {
            text-align: center;
            margin-bottom: 4rem;
        }

        .section-header h2 {
            font-size: clamp(2rem, 4vw, 3rem);
            color: var(--primary-color);
            margin-bottom: 1rem;
            position: relative;
        }

        .section-header h2::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 4px;
            background: linear-gradient(90deg, var(--accent-color), var(--secondary-color));
            border-radius: 2px;
        }

        .section-header p {
            font-size: 1.2rem;
            color: var(--text-light);
            max-width: 600px;
            margin: 0 auto;
        }

        /* Story Section */
        .story-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 3rem;
            align-items: center;
        }

        .story-content h3 {
            font-size: 1.8rem;
            color: var(--primary-color);
            margin-bottom: 1.5rem;
        }

        .story-content p {
            font-size: 1.1rem;
            line-height: 1.8;
            margin-bottom: 1.5rem;
            color: var(--text-light);
        }

        .story-image {
            position: relative;
            border-radius: var(--border-radius);
            overflow: hidden;
            box-shadow: var(--shadow);
            transition: var(--transition);
        }

        .story-image:hover {
            transform: translateY(-10px);
            box-shadow: var(--shadow-hover);
        }

        .story-image img {
            width: 100%;
            height: 400px;
            object-fit: cover;
            transition: var(--transition);
        }

        .story-image:hover img {
            transform: scale(1.05);
        }

        /* Values Section */
        .values-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 2rem;
        }

        .value-card {
            background: var(--white);
            padding: 2.5rem 2rem;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
            text-align: center;
            transition: var(--transition);
            position: relative;
            overflow: hidden;
        }

        .value-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--accent-color), var(--secondary-color));
            transform: translateX(-100%);
            transition: var(--transition);
        }

        .value-card:hover::before {
            transform: translateX(0);
        }

        .value-card:hover {
            transform: translateY(-10px);
            box-shadow: var(--shadow-hover);
        }

        .value-icon {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, var(--accent-color), var(--secondary-color));
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
            font-size: 1.5rem;
            color: var(--white);
            transition: var(--transition);
        }

        .value-card:hover .value-icon {
            transform: rotate(360deg) scale(1.1);
        }

        .value-card h3 {
            font-size: 1.3rem;
            color: var(--primary-color);
            margin-bottom: 1rem;
        }

        .value-card p {
            color: var(--text-light);
            line-height: 1.6;
        }

        /* Team Section */
        .team-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
        }

        .team-member {
            background: var(--white);
            border-radius: var(--border-radius);
            overflow: hidden;
            box-shadow: var(--shadow);
            transition: var(--transition);
            position: relative;
        }

        .team-member:hover {
            transform: translateY(-10px);
            box-shadow: var(--shadow-hover);
        }

        .team-avatar {
            width: 100%;
            height: 250px;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            color: var(--white);
            position: relative;
            overflow: hidden;
        }

        .team-avatar::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="35" r="15" fill="rgba(255,255,255,0.3)"/><path d="M20 80 C20 60, 35 50, 50 50 C65 50, 80 60, 80 80 Z" fill="rgba(255,255,255,0.3)"/></svg>');
            background-size: 80px;
            background-repeat: no-repeat;
            background-position: center;
        }

        .team-info {
            padding: 1.5rem;
            text-align: center;
        }

        .team-info h4 {
            font-size: 1.2rem;
            color: var(--primary-color);
            margin-bottom: 0.5rem;
        }

        .team-info .role {
            color: var(--accent-color);
            font-weight: 600;
            margin-bottom: 1rem;
        }

        .team-info p {
            color: var(--text-light);
            font-size: 0.9rem;
            line-height: 1.5;
        }

        /* Approach Section */
        .approach-steps {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 3rem;
        }

        .step {
            text-align: center;
            padding: 2rem 1rem;
            position: relative;
        }

        .step-number {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, var(--accent-color), var(--secondary-color));
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1rem;
            font-weight: 700;
            color: var(--white);
            font-size: 1.2rem;
            position: relative;
            z-index: 2;
        }

        .step::after {
            content: '';
            position: absolute;
            top: 25px;
            right: -50%;
            width: 100%;
            height: 2px;
            background: linear-gradient(90deg, var(--accent-color), transparent);
            z-index: 1;
        }

        .step:last-child::after {
            display: none;
        }

        .step h4 {
            color: var(--primary-color);
            margin-bottom: 0.5rem;
        }

        .step p {
            color: var(--text-light);
            font-size: 0.9rem;
        }

        /* Testimonials */
        .testimonials {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }

        .testimonial {
            background: var(--white);
            padding: 2rem;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
            position: relative;
            transition: var(--transition);
        }

        .testimonial:hover {
            transform: translateY(-5px);
            box-shadow: var(--shadow-hover);
        }

        .testimonial::before {
            content: '"';
            position: absolute;
            top: -10px;
            left: 20px;
            font-size: 4rem;
            color: var(--accent-color);
            line-height: 1;
        }

        .testimonial-text {
            font-style: italic;
            color: var(--text-light);
            margin-bottom: 1.5rem;
            padding-left: 1rem;
        }

        .testimonial-author {
            font-weight: 600;
            color: var(--primary-color);
        }

        .testimonial-company {
            color: var(--text-light);
            font-size: 0.9rem;
        }

        /* CTA Section */
        .cta {