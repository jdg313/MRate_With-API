let activePopupsCount = 0; // Global variable to track active popups

// Inserts an icon next to the professor's name and adds a click event listener for fetching RMP info
function insertRateMyProfessorIcon() {
  const instructorElements = document.querySelectorAll(
    'td[data-property="instructor"] .email'
  );

  if (instructorElements.length === 0) {
    console.log("Professor elements not found yet.");
    return false;
  }

  instructorElements.forEach((element) => {
    if (!element.classList.contains("rmp-icon-added")) {
      const iconElement = document.createElement("img");
      const iconPath = chrome.runtime.getURL("Icons/um16xtest.png");
      iconElement.setAttribute("src", iconPath);
      iconElement.setAttribute("style", "cursor:pointer; margin-right:5px;");
      iconElement.classList.add("rmp-icon");

      // Prepend the icon to the professor's name
      element.parentNode.insertBefore(iconElement, element);

      // Add click event listener to the icon
      iconElement.addEventListener("click", function () {
        // Get the professor's name
        let professorName = element.textContent.trim();
        professorName = professorName.split(", ").reverse().join(" ");
        // Fetch and display RMP info
        openRmpPopup(professorName);
      });
      // Mark as processed
      element.classList.add("rmp-icon-added");
    }
  });

  return true;
}

// Fetches professor info for the given professor name and displays it in a popup
function openRmpPopup(professorName) {
  // Use fetch to send request to backend
  fetch('https://mratehosting.com/api/getProfessorInfo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pName: professorName }), // Send the professor's name in the request body
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    if (data.status === "success") {
      displayRmpDataPopup(data.data); 
    } else {
      console.error("Failed to fetch professor info:", data.message);
      displayErrorPopup("Professor not found/No data available.");
    }
  })
  .catch(error => {
    console.error("Error fetching professor info:", error.message);
    displayErrorPopup("Professor not found/No data available.");
  });
}


// Displays an error message in a popup for when professor data is not found
function displayErrorPopup(message) {
  const popup = document.createElement("div");
  popup.setAttribute(
    "style",
    `
    position: fixed;
    top:50%;
    left:40%;
    background-color: white;
    font-family: Helvetica, sans-serif;
    font-size: 14px;
    padding: 5px;
    border-radius: 10px;
    z-index: 1000;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  `
  );

  const messageElement = document.createElement("p");
  messageElement.textContent = message;

  popup.appendChild(messageElement);

  document.body.appendChild(popup);

  // Function to update the popup position based on mouse coordinates
  function updatePopupPosition(event) {
    const xOffset = 20; // horizontal offset
    const yOffset = 20; // vertical offset
    popup.style.left = `${event.clientX + xOffset}px`;
    popup.style.top = `${event.clientY + yOffset}px`;
  }

  // event listener for mousemove to update popup position
  document.addEventListener("mousemove", updatePopupPosition);

  // Automatically close popup after 3 seconds
  setTimeout(() => {
    document.body.removeChild(popup);
    document.removeEventListener("mousemove", updatePopupPosition);
  }, 3000);

  updatePopupPosition(event);
}

// Function to interpolate between two red and green based on rating and difficulty level
function getColorForValue(value, isForRating = true) {
  const max = 5;
  const factor = value / max;

  // Direct linear interpolation for red and green components
  let red, green;
  if (isForRating) {
    // For rating: Green increases with value, Red decreases
    green = Math.round(255 * factor);
    red = 255 - green;
  } else {
    // For difficulty: Red increases with value, Green decreases
    red = Math.round(255 * factor);
    green = 255 - red;
  }

  return `rgb(${red},${green},0)`;
}

// Displays the RMP data in a popup
function displayRmpDataPopup(data) {
  const iconElement = document.createElement("img");
  const iconPath = chrome.runtime.getURL("Icons/umdlogo.png");
  iconElement.setAttribute("src", iconPath);

  const popup = document.createElement("div");
  popup.style.position = "fixed";
  popup.style.top = "30%";
  popup.style.left = "50%";
  popup.style.fontFamily = "Helvetica, sans-serif";
  popup.style.fontSize = "14px";
  popup.style.color = "#FFCB05";
  popup.style.borderRadius = "25px";
  popup.style.zIndex = "1000";
  popup.style.boxShadow = "0 4px 8px rgba(0,0,0,0.5)";
  popup.style.border = "1px solid #898989";
  popup.style.backgroundColor = "#00274C";
  popup.style.opacity = "0";
  popup.style.width = "400px";
  popup.style.padding = "20px";
  popup.style.transition =
    "opacity 0.4s ease-in-out, transform 0.4s ease-in-out"; // Add transition for opacity, small-to-big.
  popup.style.transform = "scale(0.5)";
  const xOffset = 20 * activePopupsCount;
  const yOffset = 20 * activePopupsCount;
  popup.style.left = `calc(50% + ${xOffset}px)`;
  popup.style.top = `calc(30% + ${yOffset}px)`;

  activePopupsCount++;

  let isDragging = false;
  let offsetX, offsetY;

  popup.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - popup.getBoundingClientRect().left;
    offsetY = e.clientY - popup.getBoundingClientRect().top;
    popup.style.zIndex = "1001";
  });

  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      const newX = e.clientX - offsetX;
      const newY = e.clientY - offsetY;

      popup.style.left = newX + "px";
      popup.style.top = newY + "px";
    }
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
    popup.style.zIndex = "1000";
  });

  const buttonStyle = `
    background-color: #00274C;
    color: #FFCB05;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    text-transform: uppercase;
    font-weight: bold;
    font-family: Helvetica, sans-serif;
    text-align: center;
    transition: background-color 0.3s, color 0.3s;
    display: block;
    margin: 10px auto 0;
    width: auto;
  `;

  popup.innerHTML = `
    <h2 style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <span>${data.pname}</span>
      <div style="display: flex; align-items: center;">
        <img src="${iconPath}" alt="Logo" style="width: 50px; height: 50px; margin-right: 20px;">
      <span style="margin-left: auto;">Rate My Professor</span>
    </h2>
    <div style="margin-bottom: 10px; border-bottom: 1px solid white;">
      <p><strong style="color: #FFCB05;">Rating:</strong> <span class="data-element" style="color: ${getColorForValue(
        data.rating,
        true
      )};">${data.rating}/5</span></p>
    </div>
    <div style="margin-bottom: 10px; border-bottom: 1px solid white;">
      <p><strong style="color: #FFCB05;">Number of Ratings:</strong> <span class="data-element" style="color: #EFF0F1;">${
        data.numberofratings
      }</span></p>
    </div>
    <div style="margin-bottom: 10px; border-bottom: 1px solid white;">
      <p><strong style="color: #FFCB05;">Difficulty Level:</strong> <span class="data-element" style="color: ${getColorForValue(
        data.difficultylevel,
        false
      )};">${data.difficultylevel}/5</span></p>
    </div>
    <div style="margin-bottom: 10px; border-bottom: 1px solid white;">
      <p><strong style="color: #FFCB05;">Would Take Again:</strong> <span class="data-element" style="color: #EFF0F1;">${
        data.takeagainpercentage
      }%</span></p>
    </div>
    <div style="margin-bottom: 20px;">
      <p><strong style="color: #FFCB05;">Most Recent Review:</strong> <span class="data-element" style="color: #EFF0F1;">${
        data.mostrecentreview
      }</span></p>
    </div>
  `;

  const closeButton = document.createElement("button");
  closeButton.style.cssText = buttonStyle;
  closeButton.textContent = "Close";

  closeButton.onclick = () => {
    popup.style.opacity = "0";
    popup.style.transform = "scale(0.5)";
    setTimeout(() => {
      popup.remove();
      activePopupsCount--;
    }, 300);
  };

  popup.appendChild(closeButton);

  document.body.appendChild(popup);

  // Use requestAnimationFrame to ensure changes are visually reflected after the popup is in the DOM
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      popup.style.opacity = "1";
      popup.style.transform = "scale(1)";
    });
  });

}

// Use a MutationObserver to wait for the elements to be available and insert the icon
const observer = new MutationObserver((mutations, obs) => {
  // Always try to insert icons on mutation, do not disconnect
  insertRateMyProfessorIcon();
});

// Observe the body for changes in child elements
observer.observe(document.body, { childList: true, subtree: true });

// Initial check in case the elements are already there before the observer starts
insertRateMyProfessorIcon();
