import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Fade in animation
export const fadeIn = (element, options = {}) => {
  return gsap.from(element, {
    opacity: 0,
    y: 30,
    duration: 0.8,
    ease: "power3.out",
    ...options,
  });
};

// Slide in from left
export const slideInLeft = (element, options = {}) => {
  return gsap.from(element, {
    x: -100,
    opacity: 0,
    duration: 0.8,
    ease: "power3.out",
    ...options,
  });
};

// Slide in from right
export const slideInRight = (element, options = {}) => {
  return gsap.from(element, {
    x: 100,
    opacity: 0,
    duration: 0.8,
    ease: "power3.out",
    ...options,
  });
};

// Scale in animation
export const scaleIn = (element, options = {}) => {
  return gsap.from(element, {
    scale: 0.8,
    opacity: 0,
    duration: 0.6,
    ease: "back.out(1.7)",
    ...options,
  });
};

// Stagger children animation
export const staggerChildren = (parent, options = {}) => {
  const children = parent.children;
  return gsap.from(children, {
    opacity: 0,
    y: 30,
    duration: 0.6,
    stagger: 0.1,
    ease: "power3.out",
    ...options,
  });
};

// Hover scale effect
export const hoverScale = (element, scale = 1.05) => {
  element.addEventListener("mouseenter", () => {
    gsap.to(element, {
      scale,
      duration: 0.3,
      ease: "power2.out",
    });
  });

  element.addEventListener("mouseleave", () => {
    gsap.to(element, {
      scale: 1,
      duration: 0.3,
      ease: "power2.out",
    });
  });
};

// Glow pulse animation
export const glowPulse = (element, options = {}) => {
  return gsap.to(element, {
    boxShadow: "0 0 30px rgba(99, 102, 241, 0.6)",
    duration: 1.5,
    ease: "power1.inOut",
    repeat: -1,
    yoyo: true,
    ...options,
  });
};

// Scroll-triggered fade in
export const scrollFadeIn = (elements, options = {}) => {
  return gsap.from(elements, {
    scrollTrigger: {
      trigger: elements,
      start: "top 80%",
      end: "bottom 20%",
      toggleActions: "play none none reverse",
      ...options.scrollTrigger,
    },
    opacity: 0,
    y: 50,
    duration: 0.8,
    ease: "power3.out",
    stagger: 0.2,
    ...options,
  });
};

// Parallax scroll effect
export const parallax = (element, speed = 0.5) => {
  gsap.to(element, {
    scrollTrigger: {
      trigger: element,
      start: "top bottom",
      end: "bottom top",
      scrub: true,
    },
    y: (i, target) => -ScrollTrigger.maxScroll(window) * speed,
    ease: "none",
  });
};

// Rotate on scroll
export const rotateOnScroll = (element, options = {}) => {
  return gsap.to(element, {
    scrollTrigger: {
      trigger: element,
      start: "top bottom",
      end: "bottom top",
      scrub: true,
      ...options.scrollTrigger,
    },
    rotation: 360,
    ease: "none",
    ...options,
  });
};

// Text reveal animation
export const textReveal = (element, options = {}) => {
  const text = element.textContent;
  element.innerHTML = text
    .split("")
    .map(
      (char) =>
        `<span style="display: inline-block; opacity: 0;">${
          char === " " ? "&nbsp;" : char
        }</span>`
    )
    .join("");

  return gsap.to(element.children, {
    opacity: 1,
    y: 0,
    duration: 0.05,
    stagger: 0.03,
    ease: "power1.out",
    ...options,
  });
};

// Navbar shrink on scroll
export const navbarShrink = (navbar) => {
  return ScrollTrigger.create({
    trigger: document.body,
    start: "top -100",
    end: 99999,
    onEnter: () => {
      gsap.to(navbar, {
        padding: "0.5rem 0",
        duration: 0.3,
        ease: "power2.out",
      });
    },
    onLeaveBack: () => {
      gsap.to(navbar, {
        padding: "1rem 0",
        duration: 0.3,
        ease: "power2.out",
      });
    },
  });
};

// Card flip animation
export const flipCard = (element, options = {}) => {
  return gsap.from(element, {
    rotationY: 90,
    opacity: 0,
    duration: 0.8,
    ease: "power3.out",
    ...options,
  });
};

// Loading pulse
export const loadingPulse = (element) => {
  return gsap.to(element, {
    opacity: 0.5,
    duration: 0.8,
    ease: "power1.inOut",
    repeat: -1,
    yoyo: true,
  });
};
