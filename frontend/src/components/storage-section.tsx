"use client";

import { Fira_Code, Montserrat, Raleway } from "next/font/google";
import { useEffect, useState } from "react";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

const raleway = Raleway({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

interface Story {
  id: number;
  name: string;
  avatar: string;
  content: string;
}

const STORIES: Story[] = [{
  "id": 1,
  "name": "Ravi Kumar",
  "avatar": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_T4gIa3-huI-PtTmRr95TxKLqS3KBnCtTgw&s",
  "content": "I bought tickets online for a concert, but when I arrived, I found out they were duplicates. I lost both my money and the chance to attend."
},
{
  "id": 2,
  "name": "Meera Singh",
  "avatar": "https://jovialjourneys.co.in/wp-content/themes/twentytwentyone/assets_jj/image/1.jpg",
  "content": "I purchased tickets for a cricket match from an online seller, but when I reached the venue, I was told my tickets were fake. It was so disappointing."
},
{
  "id": 3,
  "name": "Rajesh Gupta",
  "avatar": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQMYmkj15d_oBJIwQGDWQmjM8pqkoZlzfNWCw&s",
  "content": "Excited for the music festival, I bought tickets online. When I showed up, I was told they were counterfeit. I felt devastated after all the anticipation."
},
{
  "id": 4,
  "name": "Asha Desai",
  "avatar": "https://deft360.com/wp-content/uploads/2016/01/Pooja-1-e1622323927868-350x350.jpg",
  "content": "I tried buying tickets for a play, but when I went online, scalpers had grabbed them all. I couldn’t even find a single available seat."
},
{
  "id": 5,
  "name": "Karan Joshi",
  "avatar": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQynU45UTbLodkNC19ePHes5plJNUNe0c2AhQ&s",
  "content": "I paid extra for ‘VIP’ tickets to a concert. When I arrived, I was given regular tickets. The scam was disappointing, and I felt completely taken advantage of."
},
{
  "id": 6,
  "name": "Nisha Patel",
  "avatar": "https://media.istockphoto.com/id/1135381120/photo/portrait-of-a-young-woman-outdoors-smiling.jpg?s=612x612&w=0&k=20&c=T5dukPD1r-o0BFqeqlIap7xzw07icucetwKaEC2Ms5M=",
  "content": "I bought tickets for a highly anticipated sports event, but due to scalpers overbooking the venue, I couldn’t get in. My plans were ruined that day."
},
{
  "id": 7,
  "name": "Anil Mehta",
  "avatar": "https://www.amity.edu/gurugram/microbackoffice/Uploads/TestimonialImage/98testi_RajivBasavaalumni.jpg",
  "content": "I purchased tickets for an event online, but after payment, the seller disappeared without a trace. I was left with nothing but frustration and wasted money."
},
{
  "id": 8,
  "name": "Sita Reddy",
  "avatar": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRfep5EJ7f5F5XjaWL1doD6Xv6gOrf-TVbbAkFpR0PclNpNAqy_3RW45foP8bNgd4TYlxc&usqp=CAU",
  "content": "I bought tickets to a concert, only to be told at the venue that they were fake. The whole experience was heartbreaking, especially after paying so much."
},
{
  "id": 9,
  "name": "Vikram Sharma",
  "avatar": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSm1eXfTfzDGDzyuE_dPsRODDHISZMrsKVwGcv7-xzZ1bP0QonUktPQLz5bw8mys-1tWuQ&usqp=CAU",
  "content": "I tried to buy tickets for a sold-out event, but the only ones left were insanely overpriced by scalpers. It felt unfair, and I missed the chance."
},
{
  "id": 10,
  "name": "Priya Rao",
  "avatar": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTNsEwdKJ-1baff5Q6k8jHMezSQokxWs3wMA&s",
  "content": "I bought event tickets through a third-party vendor, but when I showed up, I was told my tickets were duplicates. I couldn’t believe I’d been scammed."
}
];

export default function StoriesSection() {
  const [isHovered, setIsHovered] = useState(false);
  const doubledStories = [...STORIES, ...STORIES];

  return (
    <div className="min-h-screen text-white py-12 sm:py-16 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-left gap-2 mb-8 sm:mb-12">
          <span
            className={`${firaCode.className} px-4 py-1 font-normal text-sm rounded-full bg-[#8080804D] text-[#FFFFFFB2] w-fit`}
          >
            Stories
          </span>
          <h2
            className={`${montserrat.className} text-3xl sm:text-4xl text-[#FFFFFFB2] font-medium`}
          >
            <span className="text-white">Share your</span> Stories
          </h2>
        </div>

        <div
          className="space-y-6 sm:space-y-8"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Responsive story cards */}
          <div className="relative">
            <div
              className={`flex gap-4 sm:gap-6 animate-scroll-right ${
                isHovered ? "pause-animation" : ""
              }`}
            >
              {doubledStories.map((story, idx) => (
                <StoryCard
                  key={`${story.id}-${idx}-top`}
                  {...story}
                  // className="w-[280px] sm:w-[300px]"
                />
              ))}
            </div>
          </div>

          <div className="relative">
            <div
              className={`flex gap-4 sm:gap-6 animate-scroll-left ${
                isHovered ? "pause-animation" : ""
              }`}
            >
              {doubledStories.map((story, idx) => (
                <StoryCard
                  key={`${story.id}-${idx}-bottom`}
                  {...story}
                  // className="w-[280px] sm:w-[300px]"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StoryCard({ name, avatar, content }: Story) {
  return (
    <div
      className="
        flex-shrink-0
        w-[300px]
        bg-gradient-to-br from-[#1F2937] to-[#283544]
        rounded-2xl
        p-6
        backdrop-blur-sm
        shadow-lg
        border border-transparent
        transition-transform duration-300 ease-in-out
        hover:scale-105 hover:shadow-2xl hover:-translate-y-2
        cursor-pointer
      "
    >
      <div className="flex items-center gap-3 mb-4">
        <img
          src={avatar || "/placeholder.svg"}
          alt={name}
          className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
        />
        <span className={`${raleway.className} font-semibold text-white`}>
          {name}
        </span>
      </div>
      <p className={`${raleway.className} text-sm text-[#E0E0E0CC] leading-relaxed font-normal`}>
        {content}
      </p>
    </div>
  );
}