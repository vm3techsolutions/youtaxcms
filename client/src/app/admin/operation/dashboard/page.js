const Dashboard = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded shadow hover:shadow-lg transition">
                <h3 className="text-lg font-bold mb-2">Total Orders</h3>
                <p className="text-2xl">120</p>
            </div>
            <div className="bg-white p-6 rounded shadow hover:shadow-lg transition">
                <h3 className="text-lg font-bold mb-2">Messages</h3>
                <p className="text-2xl">15</p>
            </div>
            <div className="bg-white p-6 rounded shadow hover:shadow-lg transition">
                <h3 className="text-lg font-bold mb-2">Notifications</h3>
                <p className="text-2xl">8</p>
            </div>
            <div className="bg-white p-6 rounded shadow hover:shadow-lg transition">
                <h3 className="text-lg font-bold mb-2">Revenue</h3>
                <p className="text-2xl">$3,400</p>
            </div>
            <div className="bg-white p-6 rounded shadow hover:shadow-lg transition">
                <h3 className="text-lg font-bold mb-2">Tasks</h3>
                <p className="text-2xl">24</p>
            </div>
            <div className="bg-white p-6 rounded shadow hover:shadow-lg transition">
                <h3 className="text-lg font-bold mb-2">Feedback</h3>
                <p className="text-2xl">5</p>
            </div>
        </div>
    );
};

export default Dashboard;
