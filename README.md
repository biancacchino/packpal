# 🎒 PackPal.fit

**A smart, collaborative packing assistant that makes trip planning effortless.**

## DevPost

- [Devpost](https://devpost.com/software/packpals)


[![Devpost](https://img.shields.io/badge/built%20in-24%20hours-orange)](https://devpost.com/software/packpals)

## 🌟 Overview

Built at NewHacks 2025, PackPal.fit is a full-stack web application that helps users organize, save, and manage packing lists for any type of trip. Whether you're planning an international vacation or a weekend getaway, PackPal ensures you never forget essentials or duplicate items across your group.

## ✨ Key Features

- **Smart Trip Management**: Create, edit, and delete trips with an intuitive dashboard
- **AI-Powered Suggestions**: Integrated Gemini 2.5 chatbot provides intelligent packing recommendations based on natural language prompts
- **List Sharing**: Collaborate with travel companions and share packing lists
- **Clean, Modern UI**: Responsive design with smooth navigation and user-friendly interface
## 📸 Screenshots

<img width="500" height="500" alt="PackPal-landing-page" src="https://github.com/user-attachments/assets/f15bb9dc-3490-44a2-a37a-827d1e1829f0" />
<img width="500" height="500" alt="PackPal-dashboard" src="https://github.com/user-attachments/assets/d491a8a9-461d-481b-879f-710648a4fe56" />
<img width="500" height="500" alt="PackPal-YourTrips" src="https://github.com/user-attachments/assets/f61c32fe-ea7e-4911-963d-393813979734" />
<img width="500" height="500" alt="PackPal-Friends" src="https://github.com/user-attachments/assets/f5a8ca45-766f-4e0e-86ef-d1abcffb727a" />
<img width="500" height="500" alt="PackPal ChatBot using Gemini 2.5" src="https://github.com/user-attachments/assets/6429b889-9170-4c2b-ab36-1f7278568b31" />
<img width="500" height="500" alt="PackPal Trip List w/ChatBot Picture in Picture" src="https://github.com/user-attachments/assets/8fd40877-2236-4791-9b68-a4d032fe9aa7" />

## 🎯 The Problem We Solved

Trip packing often leads to:
- Overpacking unnecessary items
- Forgetting essential items
- Duplicate items when traveling with groups
- Lack of coordination among travelers

## 🛠️ Tech Stack

**Frontend:**
- Next.js
- React
- TypeScript
- Tailwind CSS

**Backend:**
- PostgreSQL
- Drizzle ORM
- NextAuth (Authentication)

**AI Integration:**
- Google Gemini 2.5 API

**Deployment:**
- GoDaddy (Custom Domain)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- Google Gemini API key

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/packpal.git
cd packpal

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your database URL, NextAuth secret, and Gemini API key

# Run database migrations
npm run db:push

# Start the development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 💡 How It Works

1. **Create a Trip**: Set up a new trip with basic details
2. **Get AI Suggestions**: Use the chatbot by typing prompts like "I'm going on a 3-day ski trip"
3. **Manage Your List**: Add, remove, or edit items as needed
4. **Share with Others**: Collaborate with travel companions to avoid overlap
5. **Track Progress**: View all your trips from the dashboard

## 🏆 Achievements

- Built a complete full-stack application in under 24 hours
- Integrated cutting-edge AI technology for practical use
- Deployed to production with custom domain
- Created polished, production-ready UI/UX

## 🎓 What We Learned

- Industry-standard version control practices with GitHub
- Team collaboration through branches and merges
- AI API integration and connecting ML models to web applications
- Rapid prototyping and development under time constraints
- Full-stack development workflow from concept to deployment

## 👥 My Teammates
- [Lori Battouk](https://github.com/LoriB14)
- [Arany Mahendran](https://github.com/aranym123)
