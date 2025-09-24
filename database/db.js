import mongoose from "mongoose";


const Max_Retries = 3;
const Retry_Delay = 5000; // in millisecond

class DatabaseConnection {
	constructor() {
		this.Retry_Delay = 0;
		this.isConnected = false;
		// configure mongoose  settings 

		mongoose.set('strictQuery', true);

		mongoose.connection.on('connected', () => {
			console.log('Database connected');
			this.isConnected = true;
			
		});

		mongoose.connection.on('error', () => {
			console.error('Database connection error');
			this.isConnected = false;
		});


		mongoose.connection.on('disconnected', async () => {
			console.log('Database disconnected');
			this.isConnected = false;

			await this.HandleDisconnection();
			
		});

		process.on('SIGTERM',this.HandleConnecttionFail.bind(this))
	}

	async connect() {
		try {
			if (!process.env.MONGO_URI) {
				throw new Error('MONGO_URI is not defined in environment variables');
			}

			const connectionOptions = {
				useNewUrlParser: true,
				useUnifiedTopology: true,
				maxPoolSize: 10,
				serverSelectionTimeoutMS: 5000,
				socketTimeoutMS: 45000,
				family: 4, // Use IPv4, skip trying IPv6
			};

			if (process.env.NODE_ENV === 'development') {
				mongoose.set('debug', true);
			}

			await mongoose.connect(process.env.MONGO_URI, connectionOptions);
			this.retryCount = 0; // reset retry count on successful connection
		} catch (error) {
			console.error('Database connection failed:', error);
			this.HandleConnecttionFail();
		}




	}

	async HandleConnecttionFail (){
		if(this.retryCount < Max_Retries){
			this.retryCount++;
			console.log(`Retrying to connect to database... Attempt ${this.retryCount} of ${Max_Retries}`);
			await new Promise(res => setTimeout(res, Retry_Delay));
			return this.connect();
  	    }else{
			console.error('Max retries reached. Could not connect to database.');
			process.exit(1); // Exit the process with failure
		}

	}


	async HandleDisconnection(){
		if(!this.isConnected){
			console.log('Attempting to reconnect to the database...');
			await this.connect();
		}
	}

	async handleAppTermination(){
		try {
			 await mongoose.connection.close();
			 console.log('Database connection closed due to application termination');
			 process.exit(0);
		} catch (error) {
			console.error('Error closing database connection:', error);
			process.exit(1);
		}
	}

	getConnectionStatus(){
		return {
			isConnected: this.isConnected,
			readyState: mongoose.connection.readyState,
			host: mongoose.connection.host,
			name: mongoose.connection.name,
			port: mongoose.connection.port
		};
	}


}
 


// creation of singleton connection 

const dbConnection = new DatabaseConnection();	

export default  dbConnection.connect.bind(dbConnection);
export const dbConnectionStatus = dbConnection.getConnectionStatus.bind(dbConnection);