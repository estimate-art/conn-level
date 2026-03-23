

export type OutletData = { [key: string]: string | number };

export type RawData = OutletData[];

export type OutletGroup = {
  fileName: string;
  outlets: string[];
};

export type FactCategory = {
  category: string;
  fact?: number;
  levels: { name: string; value: number | string }[];
  fields?: { name: string; value: string | number }[];
  extraFacts?: { name: string; col: string }[];
};

export type ProcessedPrpData = {
  data: {
    outlet: string;
    'Успішно': number;
    'Неуспішно': number;
    'У стадії перевірки': number;
    'Всього': number;
  }[];
  totals: {
    outlet: string;
    'Успішно': number;
    'Неуспішно': number;
    'У стадії перевірки': number;
    'Всього': number;
  };
};

export type ProcessedPopData = {
  summary: {
    data: {
      outlet: string;
      'Успішно': number;
      'Неуспішно': number;
      'Всього': number;
    }[];
    totals: {
      outlet: string;
      'Успішно': number;
      'Неуспішно': number;
      'Всього': number;
    };
  };
  details: {
    id: string;
    outlet: string;
    connection: string;
    login: string;
    account: number | string;
    phone: string;
  }[];
};

export type Achievement = {
  icon: string;
  categoryName: string;
  data: string;
  rowColor: string;
};

export type AchievementData = {
  achievements: Achievement[];
  showCoin: boolean;
};

export type OutletPerformanceData = {
  factData: FactCategory[];
  details: string | null;
  rawData: OutletData;
}

export type OutletDataMap = Map<string, OutletPerformanceData>;

export type ViewMode = 'dashboard' | 'flex' | 'smart' | 'vf-style';
export type AppView = 'main-menu' | 'statistics' | 'sms-form' | 'sales';
export type StatisticsView = 'menu' | 'vf-style' | 'prp-report' | 'pop-report' | 'flexbox-report' | 'pacing-dialog' | 'orders';

// Order Types
export type OrderData = {
    id: string;
    code: string | null;
    name: string;
    quantity: number;
    price: number;
    brand: string | null;
};

export type OrderColumnMapping = {
    headerRow: number;
    code: string | null;
    name: string | null;
    quantity: string | null;
    priceColumn: string;
};


// --- New Sales Analytics System Types ---

// Configuration Types (from sales.config.json)
export type CategoryRule = {
    id: string;
    label: string;
    priority: number;
    tags: string[];
};

export type SellerAliases = {
    [key: string]: string; // e.g. "цюра": "Олександр Цюра"
};

export type DepartmentConfig = {
    key: string;      // The substring to search for (e.g., "ОЛДІ")
    label: string;    // The clean name to assign (e.g., "Олді")
};

export type TableColumnConfig = {
    header: string;
    accessor: keyof ViewableSale;
    className?: string;
    format?: 'currency' | 'text';
};

export type SalesConfig = {
    rules: CategoryRule[];
    sellers: SellerAliases;
    departments: DepartmentConfig[];
    tableColumns: TableColumnConfig[];
};


// RemOnline API Data Structure
export type RemOnlineProduct = {
    id: number;
    type?: 'sale' | 'return'; // type might be optional
    product_id?: number;
    price: number;
    amount: number;
    title: string;
};

export type RemOnlineSale = {
    id: number;
    id_label: string;
    created_at: number; // Unix timestamp in milliseconds
    created_by_id: number;
    warehouse_id: number;
    description: string;
    products: RemOnlineProduct[];
    client?: {
        id: number;
        name: string;
        phone: string[];
    };
};


// Processed Data Structure
export type ClassifiedProduct = {
  title: string;
  category: string;
  isAmbiguous: boolean;
  price: number;
  amount: number;
  total: number;
};

export type ProcessedSale = {
    originalId: number;
    id_label: string;
    department: { label: string };
    seller: { name: string };
    products: ClassifiedProduct[];
    status: 'PROCESSED' | 'NEEDS_REVIEW';
    reviewReasons: string[];
    timestamp: number;
    clientName: string;
};


// Data structure for the UI Table (flattened)
export type ViewableSale = {
    id_label: string;
    timestamp: number;
    department: string;
    seller: string;
    category: string;
    title: string;
    total: number;
    margin?: number; // Add margin as optional
    clientName: string;
    status: 'PROCESSED' | 'NEEDS_REVIEW';
    reviewReasons: string[];
};

// Types for Product Remains (Залишки) - High-Reliability Engine
export type ProductCategory = {
    id: number;
    title: string;
    parent_id?: number | null;
}

export type Branch = {
    id: number;
    name: string;
};

export type Warehouse = {
    id: number;
    title: string;
    branch_id: number;
};

export type ProductStockItem = {
    warehouse_id: number;
    branch_label: string;
    quantity: number;
    purchase_price: number | null;
    serial_numbers: string[];
};

export type ProductSearchResult = {
    id: number;
    title: string;
    article: string | null;
    prices: { [key: string]: number };
    category: string;
    total_quantity: number;
    latest_purchase_price: number | null;
    warehouse_distribution: ProductStockItem[];
};


// For new reports view
export type SalesReportData = {
    current: ViewableSale[];
    previous: ViewableSale[];
};

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<string, string> }
  )
};
