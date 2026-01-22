import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import TransactionList from "./components/TransactionList";

/**
 * 首页组件
 * 包含标题栏、搜索框和交易历史列表
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <SearchBar />
      <TransactionList />
    </div>
  );
}
