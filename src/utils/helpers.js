export const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTime = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const calculateArea = (coordinates) => {
  if (!coordinates || coordinates.length < 3) return 0;
  
  let area = 0;
  const n = coordinates.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coordinates[i].latitude * coordinates[j].longitude;
    area -= coordinates[j].latitude * coordinates[i].longitude;
  }
  
  area = Math.abs(area) / 2;
  const areaInSqMeters = area * 111320 * 111320;
  const areaInHectares = areaInSqMeters / 10000;
  
  return areaInHectares;
};

export const formatArea = (areaInHectares) => {
  if (!areaInHectares || areaInHectares === 0) return '0.00 ha';
  if (areaInHectares < 1) {
    return `${(areaInHectares * 10000).toFixed(0)} sq m`;
  }
  return `${areaInHectares.toFixed(2)} ha`;
};

export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return '#43A047';
    case 'completed':
      return '#1E88E5';
    case 'cancelled':
      return '#E53935';
    default:
      return '#9E9E9E';
  }
};

export const getOperationTypeLabel = (type) => {
  const types = {
    tillage: 'Tillage',
    sowing: 'Sowing',
    spraying: 'Spraying',
    weeding: 'Weeding',
    harvesting: 'Harvesting',
    threshing: 'Threshing',
    grading: 'Grading',
  };
  return types[type] || type;
};

export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export default {
  formatDate,
  formatDateTime,
  formatTime,
  calculateArea,
  formatArea,
  getStatusColor,
  getOperationTypeLabel,
  capitalizeFirst,
  truncateText,
};
